<?php

use App\Support\Icons;

// A frontend `utils/icons.ts` ugyanezt az ellenőrző összeget várja: a két ikonkészlet nem térhet el.
const ICONS_CHECKSUM = '62269af0b530ed4c09705cb441ba116e';

it('húsz előre definiált ikont ad, kötőjeles kisbetűs névvel', function () {
    expect(Icons::names())->toHaveCount(20);

    foreach (Icons::names() as $name) {
        expect($name)->toMatch('/^[a-z]+(?:-[a-z]+)*$/');
    }
});

it('a névsorban rendezett név és SVG-belső párok ellenőrző összege egyezik a frontendével', function () {
    $names = Icons::names();
    sort($names);
    $canonical = implode('', array_map(fn (string $name) => $name."\n".Icons::markup($name)."\n", $names));

    expect(md5($canonical))->toBe(ICONS_CHECKSUM);
});

it('csak rajzelemeket és biztonságos attribútumokat tartalmaz', function () {
    foreach (Icons::names() as $name) {
        $markup = Icons::markup($name);

        preg_match_all('/<(\w+)/', $markup, $tags);
        expect(array_diff(array_unique($tags[1]), ['path', 'polygon', 'polyline', 'circle', 'line', 'rect']))->toBe([]);
        expect($markup)->not->toMatch('/\bon\w+\s*=|script|href|style/i');
    }
});

it('ismeretlen névre és nem szöveges értékre üres, nem SVG-t ad', function (mixed $name) {
    expect(Icons::markup($name))->toBe('')->and(Icons::svg($name))->toBe('');
})->with([
    'null' => [null],
    'ismeretlen név' => ['nincs-ilyen'],
    'SVG-kód' => ['<svg onload=x>'],
    'tömb' => [['star']],
    'szám' => [42],
    'üres' => [''],
]);

it('az engedélyezett ikon dekoratív, a kiemelőszínt átvevő SVG', function () {
    expect(Icons::svg('star'))
        ->toStartWith('<svg class="icon" viewBox="0 0 24 24"')
        ->toContain('stroke="currentColor"')
        ->toContain('aria-hidden="true"')
        ->toContain('focusable="false"')
        ->toEndWith('</svg>');
});
