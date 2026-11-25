<?php

use App\Support\Markdown;

// A frontend `utils/__tests__/markdown.spec.ts` ugyanezeket az eseteket várja: az előnézet és a publikált oldal azonos.
dataset('markdown-esetek', [
    'üres' => ['', ''],
    'csak szóköz' => ['   ', ''],
    'sima szöveg' => ['Szia', '<p>Szia</p>'],
    'sortörés' => ['Első'."\n".'Második', '<p>Első<br>Második</p>'],
    'Windows sorvég' => ['Első'."\r".''."\n".'Második', '<p>Első<br>Második</p>'],
    'bekezdések' => ['Első'."\n".''."\n".'Második', '<p>Első</p><p>Második</p>'],
    'félkövér és dőlt' => ['**fontos** és *dőlt*', '<p><strong>fontos</strong> és <em>dőlt</em></p>'],
    'dőlt a félkövérben' => ['**félkövér *dőlt* belül**', '<p><strong>félkövér <em>dőlt</em> belül</strong></p>'],
    'felsorolás kötőjellel' => ['- egy'."\n".'- kettő', '<ul><li>egy</li><li>kettő</li></ul>'],
    'felsorolás csillaggal' => ['* egy'."\n".'* kettő', '<ul><li>egy</li><li>kettő</li></ul>'],
    'számozott lista' => ['1. egy'."\n".'2. kettő', '<ol><li>egy</li><li>kettő</li></ol>'],
    'lista a bekezdések között' => ['Bevezető'."\n".'- egy'."\n".'- kettő'."\n".'Záró', '<p>Bevezető</p><ul><li>egy</li><li>kettő</li></ul><p>Záró</p>'],
    'számozott és felsorolás egymás után' => ['1. egy'."\n".'- kettő', '<ol><li>egy</li></ol><ul><li>kettő</li></ul>'],
    'formázás a listában' => ['* **félkövér** elem', '<ul><li><strong>félkövér</strong> elem</li></ul>'],
    'külső hivatkozás' => ['[példa](https://example.com/?a=1&b=2)', '<p><a href="https://example.com/?a=1&amp;b=2" rel="noopener noreferrer">példa</a></p>'],
    'belső hivatkozás' => ['[oldal](/helyi/oldal)', '<p><a href="/helyi/oldal" rel="noopener noreferrer">oldal</a></p>'],
    'horgony' => ['Lásd [itt](#rész).', '<p>Lásd <a href="#rész" rel="noopener noreferrer">itt</a>.</p>'],
    'veszélyes protokoll' => ['[rossz](javascript:alert(1))', '<p>[rossz](javascript:alert(1))</p>'],
    'data URL' => ['[rossz](data:text/html,x)', '<p>[rossz](data:text/html,x)</p>'],
    'protokollfüggetlen cím' => ['[rossz](//example.com)', '<p>[rossz](//example.com)</p>'],
    'lezáratlan jelek' => ['**nincs lezárva és *sem', '<p>**nincs lezárva és *sem</p>'],
    'csak jelek' => ['**', '<p>**</p>'],
    'négy csillag' => ['****', '<p>****</p>'],
    'szóközzel határolt csillag' => ['2 * 3 * 4', '<p>2 * 3 * 4</p>'],
    'üres felirat' => ['[](https://example.com)', '<p>[](https://example.com)</p>'],
    'nyers HTML escape-elve' => ['<script>alert(1)</script> **x**', '<p>&lt;script&gt;alert(1)&lt;/script&gt; <strong>x</strong></p>'],
    'HTML a felirat helyén' => ['[<b>x</b>](/a)', '<p><a href="/a" rel="noopener noreferrer">&lt;b&gt;x&lt;/b&gt;</a></p>'],
    'ékezetes szöveg' => ['*árvíztűrő* **tükörfúrógép**', '<p><em>árvíztűrő</em> <strong>tükörfúrógép</strong></p>'],
]);

it('a bemenetből a várt HTML-t építi', function (string $source, string $html) {
    expect(Markdown::toHtml($source))->toBe($html);
})->with('markdown-esetek');

it('az idézőjelet és az aposztrófot is escape-eli, a hivatkozás attribútumába is', function () {
    expect(Markdown::toHtml('Az "idézet" és a \'szó\''))->toBe('<p>Az &quot;idézet&quot; és a &#039;szó&#039;</p>')
        ->and(Markdown::toHtml('[x](https://example.com/?a="b")'))
        ->toBe('<p><a href="https://example.com/?a=&quot;b&quot;" rel="noopener noreferrer">x</a></p>');
});

it('script, eseménykezelő és veszélyes protokoll nem jut a kimenetre', function (string $source) {
    $html = Markdown::toHtml($source);

    expect($html)
        ->not->toContain('<script')
        ->not->toContain('<img')
        ->not->toContain('<svg')
        // A visszautasított link szövegként marad (ártalmatlan), de hivatkozás nem készül belőle.
        ->not->toMatch('/href="\s*(javascript|data|vbscript):/i')
        ->not->toMatch('/<[^>]*\son\w+=/i');
})->with([
    'script' => ['<script>alert(1)</script>'],
    'kép eseménykezelővel' => ['<img src=x onerror=alert(1)>'],
    'svg' => ['<svg onload=alert(1)>'],
    'javascript: link' => ['[x](javascript:alert(1))'],
    'JAVASCRIPT: nagybetűvel' => ['[x](JaVaScRiPt:alert(1))'],
    'attribútumból kitörés' => ['[x](https://a.hu/" onclick="alert(1))'],
    'escape-elt link felirat' => ['[<img src=x onerror=alert(1)>](/a)'],
    'listaelemben' => ['- <script>alert(1)</script>'],
]);

it('csak engedélyezett elemekből épül', function () {
    $html = Markdown::toHtml("# Cím\n\n> idézet\n\n**a** *b* [c](/d)\n- e\n1. f\n<div>g</div>\n`h`");

    preg_match_all('/<\/?(\w+)/', $html, $tags);
    expect(array_diff(array_unique($tags[1]), ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a']))->toBe([]);
});

it('nagyon hosszú, hibás bemenetre is véges időben lefut', function () {
    $source = str_repeat('*a [b](', 2500).str_repeat("\n- ", 500);

    $start = microtime(true);
    $html = Markdown::toHtml($source);

    expect(microtime(true) - $start)->toBeLessThan(2.0)->and($html)->toBeString();
});
