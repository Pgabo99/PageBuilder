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

    it('elfogadja az engedélyezett ikont és az ikon nélküli címsort', function (mixed $icon) {
        $heading = ['id' => 'a', 'type' => 'heading', 'text' => 'X', 'level' => 2];
        $heading['icon'] = $icon;

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/pages", [
            'title' => 'X', 'slug' => 'x', 'content' => [$heading],
        ])->assertCreated()->assertJsonPath('data.content.0.icon', $icon);
    })->with(['star', 'check-circle', 'gift', null]);

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
