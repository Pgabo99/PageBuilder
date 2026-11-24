<?php

use App\Models\Page;
use App\Models\User;
use App\Models\Website;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->other = User::factory()->create();
    $this->website = Website::factory()->for($this->user)->create();
    $this->foreignWebsite = Website::factory()->for($this->other)->create();
});

function validContent(): array
{
    return [
        ['id' => 'c1', 'type' => 'heading', 'text' => 'Üdvözöllek', 'level' => 1],
        ['id' => 'c2', 'type' => 'text', 'text' => 'Ez egy bekezdés.'],
        ['id' => 'c3', 'type' => 'button', 'label' => 'Tovább', 'url' => '/kapcsolat'],
    ];
}

describe('lista és létrehozás', function () {
    it('a saját webhely oldalait pozíció szerint adja vissza', function () {
        Page::factory()->for($this->website)->create(['title' => 'Második', 'position' => 2]);
        Page::factory()->for($this->website)->create(['title' => 'Első', 'position' => 1]);

        $this->actingAs($this->user)->getJson("/api/v1/websites/{$this->website->id}/pages")
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Első')
            ->assertJsonPath('data.1.title', 'Második');
    });

    it('a szerver állítja be a webhelyet és a pozíciót, a tartalmat elmenti', function () {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'Kezdőlap',
            'slug' => 'kezdolap',
            'content' => validContent(),
            'website_id' => $this->foreignWebsite->id,
            'position' => 99,
        ])
            ->assertCreated()
            ->assertJsonPath('data.position', 1)
            ->assertJsonPath('data.content.0.type', 'heading');

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'Kapcsolat',
            'slug' => 'kapcsolat',
            'content' => [],
        ])->assertCreated()->assertJsonPath('data.position', 2);

        $this->assertDatabaseHas('pages', ['slug' => 'kezdolap', 'website_id' => $this->website->id]);
    });

    it('idegen webhelyre 404-et ad, és nem hoz létre oldalt', function () {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->foreignWebsite->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [],
        ])->assertNotFound();

        $this->actingAs($this->user)->getJson("/api/v1/websites/{$this->foreignWebsite->id}/pages")->assertNotFound();
        $this->assertDatabaseCount('pages', 0);
    });

    it('bejelentkezés nélkül 401-et ad', function () {
        $this->getJson("/api/v1/websites/{$this->website->id}/pages")->assertUnauthorized();
    });

    it('a slug webhelyen belül egyedi, másik webhelyen ismételhető', function () {
        Page::factory()->for($this->website)->create(['slug' => 'kapcsolat']);
        $second = Website::factory()->for($this->user)->create();

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'kapcsolat', 'content' => [],
        ])->assertUnprocessable()->assertJsonValidationErrors('slug');

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$second->id}/pages", [
            'title' => 'X', 'slug' => 'kapcsolat', 'content' => [],
        ])->assertCreated();
    });
});

describe('tartalom validálása', function () {
    it('hibás komponenseket elutasít', function (array $component, string $errorKey) {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [$component],
        ])->assertUnprocessable()->assertJsonValidationErrors($errorKey);
    })->with([
        'ismeretlen típus' => [['id' => 'a', 'type' => 'video'], 'content.0.type'],
        'címsor szöveg nélkül' => [['id' => 'a', 'type' => 'heading', 'level' => 1], 'content.0.text'],
        'címsor szintje tartományon kívül' => [['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 7], 'content.0.level'],
        'címsor szintje nulla' => [['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 0], 'content.0.level'],
        'ismeretlen címsorméret' => [['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 2, 'size' => 'huge'], 'content.0.size'],
        'CSS címsorméretként' => [['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 2, 'size' => '3rem;color:red'], 'content.0.size'],
        'tömb címsorméretként' => [['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 2, 'size' => ['large']], 'content.0.size'],
        'ismeretlen címsorigazítás' => [['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 2, 'align' => 'justify'], 'content.0.align'],
        'ismeretlen gombstílus' => [['id' => 'a', 'type' => 'button', 'label' => 'X', 'url' => '/x', 'style' => 'neon'], 'content.0.style'],
        'CSS gombstílusként' => [['id' => 'a', 'type' => 'button', 'label' => 'X', 'url' => '/x', 'style' => 'red;x:y'], 'content.0.style'],
        'ismeretlen gombméret' => [['id' => 'a', 'type' => 'button', 'label' => 'X', 'url' => '/x', 'size' => 'huge'], 'content.0.size'],
        'ismeretlen gombigazítás' => [['id' => 'a', 'type' => 'button', 'label' => 'X', 'url' => '/x', 'align' => 'justify'], 'content.0.align'],
        'ismeretlen gomblekerekítés' => [['id' => 'a', 'type' => 'button', 'label' => 'X', 'url' => '/x', 'radius' => 'round'], 'content.0.radius'],
        'tömb gombstílusként' => [['id' => 'a', 'type' => 'button', 'label' => 'X', 'url' => '/x', 'style' => ['outline']], 'content.0.style'],
        'szöveg nélküli szövegblokk' => [['id' => 'a', 'type' => 'text'], 'content.0.text'],
        'gomb felirat nélkül' => [['id' => 'a', 'type' => 'button', 'url' => '/x'], 'content.0.label'],
        'javascript: URL' => [['id' => 'a', 'type' => 'button', 'label' => 'X', 'url' => 'javascript:alert(1)'], 'content.0.url'],
        'data: URL' => [['id' => 'a', 'type' => 'button', 'label' => 'X', 'url' => 'data:text/html,x'], 'content.0.url'],
        'azonosító nélkül' => [['type' => 'text', 'text' => 'X'], 'content.0.id'],
        'ismeretlen ikon' => [['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 1, 'icon' => 'nincs-ilyen'], 'content.0.icon'],
        'SVG-kód ikonként' => [['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 1, 'icon' => '<svg onload=alert(1)></svg>'], 'content.0.icon'],
        'tömb ikonként' => [['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 1, 'icon' => ['star']], 'content.0.icon'],
    ]);

    it('elfogadja a kártyacsoportot, és csak a megengedett mezőket tárolja', function () {
        $cards = [
            'id' => 'k', 'type' => 'cards', 'cards' => [
                ['id' => 'k1', 'icon' => 'star', 'title' => 'Első', 'text' => 'Leírás', 'label' => 'Tovább', 'url' => '/kapcsolat', 'html' => '<script>', 'onclick' => 'x()'],
                ['id' => 'k2', 'title' => 'Csak cím'],
                ['id' => 'k3', 'icon' => null, 'title' => 'Üres opcionálisok', 'text' => null, 'label' => null, 'url' => null],
            ],
        ];

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [$cards],
        ])->assertCreated()->assertJsonCount(3, 'data.content.0.cards');

        $stored = Page::first()->content[0]['cards'];
        expect($stored[0])->toEqual(['id' => 'k1', 'icon' => 'star', 'title' => 'Első', 'text' => 'Leírás', 'label' => 'Tovább', 'url' => '/kapcsolat'])
            ->and($stored[1])->toEqual(['id' => 'k2', 'title' => 'Csak cím']);
    });

    it('hibás kártyacsoport-elrendezést elutasít', function (string $option, mixed $value) {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x',
            'content' => [['id' => 'k', 'type' => 'cards', $option => $value, 'cards' => [['id' => 'a', 'title' => 'X']]]],
        ])->assertUnprocessable()->assertJsonValidationErrors("content.0.$option");
    })->with([
        'oszlopszám nulla' => ['columns', 0],
        'oszlopszám öt' => ['columns', 5],
        'szöveges oszlopszám' => ['columns', 'sok'],
        'ismeretlen ikonpozíció' => ['icon_position', 'bottom'],
        'ismeretlen ikonméret' => ['icon_size', 'huge'],
        'ismeretlen igazítás' => ['text_align', 'justify'],
        'ismeretlen keret' => ['border', 'dashed'],
        'ismeretlen árnyék' => ['shadow', 'glow'],
        'ismeretlen lekerekítés' => ['radius', 'round'],
        'ismeretlen gombpozíció' => ['button_position', 'top'],
        'ismeretlen térköz' => ['gap', 'huge'],
        'ismeretlen belső margó' => ['padding', 'huge'],
        'CSS értékként' => ['gap', '1rem;color:red'],
        'tömb értékként' => ['shadow', ['small']],
    ]);

    it('elfogadja és eltárolja a kártyacsoport elrendezését', function () {
        $layout = [
            'columns' => 3, 'icon_position' => 'right', 'icon_size' => 'large', 'text_align' => 'center',
            'border' => 'thick', 'shadow' => 'medium', 'radius' => 'none', 'button_position' => 'center',
            'gap' => 'large', 'padding' => 'small',
        ];

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x',
            'content' => [['id' => 'k', 'type' => 'cards', 'cards' => [['id' => 'a', 'title' => 'X']], ...$layout]],
        ])->assertCreated();

        expect(Page::first()->content[0])->toMatchArray($layout);
    });

    it('az alapértelmezett (null) és a nélküli régi kártyacsoport érvényes, a régi nem kap új mezőt', function () {
        $old = ['id' => 'k', 'type' => 'cards', 'cards' => [['id' => 'a', 'title' => 'X']]];

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x',
            'content' => [$old, [...$old, 'id' => 'l', 'columns' => null, 'gap' => null, 'shadow' => null]],
        ])->assertCreated();

        expect(Page::first()->content[0])->toEqual($old);
    });

    it('a hat kártya még elfogadott, a hét nem', function () {
        $make = fn (int $n) => ['id' => 'k', 'type' => 'cards', 'cards' => array_map(
            fn ($i) => ['id' => "k$i", 'title' => "Kártya $i"], range(1, $n),
        )];

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [$make(6)],
        ])->assertCreated();

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'Y', 'slug' => 'y', 'content' => [$make(7)],
        ])->assertUnprocessable()->assertJsonValidationErrors('content.0.cards');
    });

    it('hibás kártyákat elutasít, a hibakulcs a kártya mezőjére mutat', function (array $cards, string $errorKey) {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [['id' => 'k', 'type' => 'cards', 'cards' => $cards]],
        ])->assertUnprocessable()->assertJsonValidationErrors($errorKey);
    })->with([
        'üres lista' => [[], 'content.0.cards'],
        'cím nélkül' => [[['id' => 'k1']], 'content.0.cards.0.title'],
        'túl hosszú cím' => [[['id' => 'k1', 'title' => str_repeat('a', 101)]], 'content.0.cards.0.title'],
        'túl hosszú leírás' => [[['id' => 'k1', 'title' => 'X', 'text' => str_repeat('a', 501)]], 'content.0.cards.0.text'],
        'ismeretlen ikon' => [[['id' => 'k1', 'title' => 'X', 'icon' => 'nincs-ilyen']], 'content.0.cards.0.icon'],
        'SVG-kód ikonként' => [[['id' => 'k1', 'title' => 'X', 'icon' => '<svg onload=x>']], 'content.0.cards.0.icon'],
        'felirat cél nélkül' => [[['id' => 'k1', 'title' => 'X', 'label' => 'Tovább']], 'content.0.cards.0.url'],
        'cél felirat nélkül' => [[['id' => 'k1', 'title' => 'X', 'url' => '/x']], 'content.0.cards.0.label'],
        'javascript: cél' => [[['id' => 'k1', 'title' => 'X', 'label' => 'Y', 'url' => 'javascript:alert(1)']], 'content.0.cards.0.url'],
        'második kártya hibás' => [[['id' => 'k1', 'title' => 'X'], ['id' => 'k2']], 'content.0.cards.1.title'],
        'azonosító nélkül' => [[['title' => 'X']], 'content.0.cards.0.id'],
    ]);

    it('a kártyacsoport kártyák nélkül (hiányzó mező) hibás', function () {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [['id' => 'k', 'type' => 'cards']],
        ])->assertUnprocessable()->assertJsonValidationErrors('content.0.cards');
    });

    it('elfogadja a becsukható részeket, és csak a megengedett mezőket tárolja', function () {
        $accordion = ['id' => 'a', 'type' => 'accordion', 'items' => [
            ['id' => 'i1', 'title' => 'Kérdés', 'text' => 'Válasz', 'open' => true, 'html' => '<script>'],
            ['id' => 'i2', 'title' => 'Másik', 'text' => 'Szöveg'],
        ]];

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [$accordion],
        ])->assertCreated()->assertJsonCount(2, 'data.content.0.items');

        expect(Page::first()->content[0]['items'][0])->toEqual(['id' => 'i1', 'title' => 'Kérdés', 'text' => 'Válasz']);
    });

    it('a húsz rész még elfogadott, a huszonegy nem', function () {
        $make = fn (int $n) => ['id' => 'a', 'type' => 'accordion', 'items' => array_map(
            fn ($i) => ['id' => "i$i", 'title' => "Rész $i", 'text' => 'Szöveg'], range(1, $n),
        )];

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [$make(20)],
        ])->assertCreated();

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'Y', 'slug' => 'y', 'content' => [$make(21)],
        ])->assertUnprocessable()->assertJsonValidationErrors('content.0.items');
    });

    it('hibás részeket elutasít, a hibakulcs a rész mezőjére mutat', function (array $component, string $errorKey) {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [['id' => 'a', 'type' => 'accordion', ...$component]],
        ])->assertUnprocessable()->assertJsonValidationErrors($errorKey);
    })->with([
        'rész nélkül' => [[], 'content.0.items'],
        'üres lista' => [['items' => []], 'content.0.items'],
        'nem tömb' => [['items' => 'szöveg'], 'content.0.items'],
        'cím nélkül' => [['items' => [['id' => 'i', 'text' => 'X']]], 'content.0.items.0.title'],
        'szöveg nélkül' => [['items' => [['id' => 'i', 'title' => 'X']]], 'content.0.items.0.text'],
        'túl hosszú cím' => [['items' => [['id' => 'i', 'title' => str_repeat('a', 151), 'text' => 'X']]], 'content.0.items.0.title'],
        'túl hosszú szöveg' => [['items' => [['id' => 'i', 'title' => 'X', 'text' => str_repeat('a', 2001)]]], 'content.0.items.0.text'],
        'azonosító nélkül' => [['items' => [['title' => 'X', 'text' => 'Y']]], 'content.0.items.0.id'],
        'második rész hibás' => [['items' => [['id' => 'i', 'title' => 'X', 'text' => 'Y'], ['id' => 'j', 'title' => 'Z']]], 'content.0.items.1.text'],
    ]);

    it('elfogadja az engedélyezett ikont és az ikon nélküli címsort', function (mixed $icon) {
        $heading = ['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 2];
        $heading['icon'] = $icon;

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [$heading],
        ])->assertCreated()->assertJsonPath('data.content.0.icon', $icon);
    })->with(['star', 'check-circle', 'gift', null]);

    it('elfogadja a H1–H6 szintet, a méretet és az igazítást egymástól függetlenül', function (int $level, ?string $size, ?string $align) {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x',
            'content' => [['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => $level, 'size' => $size, 'align' => $align]],
        ])->assertCreated()
            ->assertJsonPath('data.content.0.level', $level)
            ->assertJsonPath('data.content.0.size', $size)
            ->assertJsonPath('data.content.0.align', $align);
    })->with([
        'H1 kicsiben' => [1, 'small', 'left'],
        'H6 óriásban' => [6, 'xlarge', 'right'],
        'H3 középre' => [3, 'medium', 'center'],
        'H4 alapmérettel' => [4, null, null],
    ]);

    it('elfogadja a gomb stílusát, méretét, igazítását és lekerekítését', function (?string $style, ?string $size, ?string $align, ?string $radius) {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x',
            'content' => [['id' => 'a', 'type' => 'button', 'label' => 'X', 'url' => '/x', 'style' => $style, 'size' => $size, 'align' => $align, 'radius' => $radius]],
        ])->assertCreated()
            ->assertJsonPath('data.content.0.style', $style)
            ->assertJsonPath('data.content.0.size', $size)
            ->assertJsonPath('data.content.0.align', $align)
            ->assertJsonPath('data.content.0.radius', $radius);
    })->with([
        'körvonalas, kicsi' => ['outline', 'small', 'left', 'none'],
        'halvány, nagy' => ['soft', 'large', 'center', 'full'],
        'szöveges' => ['link', 'medium', 'right', 'medium'],
        'alapértelmezett' => [null, null, null, null],
    ]);

    it('az alapbeállítású, régi gomb továbbra is érvényes és nem kap új mezőt', function () {
        $button = ['id' => 'a', 'type' => 'button', 'label' => 'X', 'url' => '/x'];

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [$button],
        ])->assertCreated();

        expect(Page::first()->content[0])->toEqual($button);
    });

    it('az ikon nélküli, régi címsor továbbra is érvényes és nem kap ikon mezőt', function () {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x',
            'content' => [['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 1]],
        ])->assertCreated();

        expect(Page::first()->content[0])->toEqual(['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 1]);
    });

    it('elfogadja a biztonságos URL-eket', function (string $url) {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x',
            'content' => [['id' => 'a', 'type' => 'button', 'label' => 'X', 'url' => $url]],
        ])->assertCreated();
    })->with(['https://example.com/a?b=1', 'http://example.com', '/kapcsolat', '#lap-alja']);

    it('túl sok komponenst elutasít', function () {
        $content = array_map(fn ($i) => ['id' => "c$i", 'type' => 'text', 'text' => 'X'], range(1, 101));

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => $content,
        ])->assertUnprocessable()->assertJsonValidationErrors('content');
    });

    it('az ismeretlen mezőket eldobja', function () {
        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x',
            'content' => [['id' => 'a', 'type' => 'text', 'text' => 'X', 'onclick' => 'rossz()', 'html' => '<script>']],
        ])->assertCreated()->assertJsonMissingPath('data.content.0.onclick')->assertJsonMissingPath('data.content.0.html');

        expect(Page::first()->content[0])->toEqual(['id' => 'a', 'type' => 'text', 'text' => 'X']);
    });
});

describe('saját oldal', function () {
    beforeEach(fn () => $this->page = Page::factory()->for($this->website)->create(['slug' => 'sajat', 'position' => 1]));

    it('megtekinthető', function () {
        $this->actingAs($this->user)->getJson("/api/v1/pages/{$this->page->id}")
            ->assertOk()->assertJsonPath('data.slug', 'sajat');
    });

    it('módosítható, a saját slug megtartható, a webhely és a pozíció nem változik', function () {
        $this->actingAs($this->user)->putJson("/api/v1/pages/{$this->page->id}", [
            'title' => 'Új cím', 'slug' => 'sajat', 'content' => validContent(),
            'website_id' => $this->foreignWebsite->id, 'position' => 50,
        ])->assertOk()->assertJsonPath('data.title', 'Új cím')->assertJsonCount(3, 'data.content');

        expect($this->page->fresh())
            ->website_id->toBe($this->website->id)
            ->position->toBe(1);
    });

    it('törölhető', function () {
        $this->actingAs($this->user)->deleteJson("/api/v1/pages/{$this->page->id}")->assertNoContent();

        $this->assertModelMissing($this->page);
    });

    it('a webhely törlésekor törlődik', function () {
        $this->website->delete();

        $this->assertModelMissing($this->page);
    });
});

describe('idegen oldal', function () {
    beforeEach(fn () => $this->foreign = Page::factory()->for($this->foreignWebsite)->create(['title' => 'Idegen']));

    it('megtekintésre 404-et ad', function () {
        $this->actingAs($this->user)->getJson("/api/v1/pages/{$this->foreign->id}")->assertNotFound();
    });

    it('módosításra 404-et ad, és nem változik', function () {
        $this->actingAs($this->user)->putJson("/api/v1/pages/{$this->foreign->id}", [
            'title' => 'Feltört', 'slug' => 'feltort', 'content' => [],
        ])->assertNotFound();

        expect($this->foreign->fresh()->title)->toBe('Idegen');
    });

    it('törlésre 404-et ad, és megmarad', function () {
        $this->actingAs($this->user)->deleteJson("/api/v1/pages/{$this->foreign->id}")->assertNotFound();

        $this->assertModelExists($this->foreign);
    });
});
