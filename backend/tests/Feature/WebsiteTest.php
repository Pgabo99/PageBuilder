<?php

use App\Models\User;
use App\Models\Website;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->other = User::factory()->create();
});

describe('lista', function () {
    it('csak a saját webhelyeket adja vissza', function () {
        $own = Website::factory()->for($this->user)->create();
        Website::factory()->for($this->other)->create();

        $this->actingAs($this->user)->getJson('/api/v1/websites')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $own->id);
    });

    it('bejelentkezés nélkül 401-et ad', function () {
        $this->getJson('/api/v1/websites')->assertUnauthorized();
    });
});

describe('létrehozás', function () {
    it('a bejelentkezett felhasználóhoz hozza létre, a kliens user_id-ját figyelmen kívül hagyja', function () {
        $this->actingAs($this->user)->postJson('/api/v1/websites', [
            'name' => 'Árvíztűrő oldal',
            'slug' => 'arvizturo-oldal',
            'user_id' => $this->other->id,
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Árvíztűrő oldal')
            ->assertJsonPath('data.slug', 'arvizturo-oldal');

        $this->assertDatabaseHas('websites', ['slug' => 'arvizturo-oldal', 'user_id' => $this->user->id]);
    });

    it('hiányzó névre és hibás slugra 422-t ad', function (string $slug) {
        $this->actingAs($this->user)->postJson('/api/v1/websites', ['slug' => $slug])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'slug']);
    })->with([
        'nagybetű' => 'Nagy-Betu',
        'ékezet' => 'árvíz',
        'szóköz' => 'ket szo',
        'kötőjellel kezdődik' => '-elotte',
        'kötőjellel végződik' => 'utana-',
        'dupla kötőjel' => 'ket--kotojel',
        'túl hosszú' => str_repeat('a', 64),
    ]);

    it('foglalt slugra 422-t ad', function () {
        Website::factory()->for($this->other)->create(['slug' => 'foglalt']);

        $this->actingAs($this->user)->postJson('/api/v1/websites', ['name' => 'X', 'slug' => 'foglalt'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('slug');
    });
});

describe('saját webhely', function () {
    beforeEach(fn () => $this->website = Website::factory()->for($this->user)->create(['slug' => 'sajat']));

    it('megtekinthető', function () {
        $this->actingAs($this->user)->getJson("/api/v1/websites/{$this->website->id}")
            ->assertOk()
            ->assertJsonPath('data.slug', 'sajat');
    });

    it('módosítható, a saját slug megtartható, a tulajdonos nem változtatható', function () {
        $this->actingAs($this->user)->putJson("/api/v1/websites/{$this->website->id}", [
            'name' => 'Új név',
            'slug' => 'sajat',
            'user_id' => $this->other->id,
        ])->assertOk()->assertJsonPath('data.name', 'Új név');

        expect($this->website->fresh())
            ->name->toBe('Új név')
            ->user_id->toBe($this->user->id);
    });

    it('törölhető', function () {
        $this->actingAs($this->user)->deleteJson("/api/v1/websites/{$this->website->id}")->assertNoContent();

        $this->assertModelMissing($this->website);
    });
});

describe('idegen webhely', function () {
    beforeEach(fn () => $this->foreign = Website::factory()->for($this->other)->create(['name' => 'Idegen']));

    it('megtekintésre 404-et ad', function () {
        $this->actingAs($this->user)->getJson("/api/v1/websites/{$this->foreign->id}")->assertNotFound();
    });

    it('módosításra 404-et ad, és nem változik', function () {
        $this->actingAs($this->user)->putJson("/api/v1/websites/{$this->foreign->id}", [
            'name' => 'Feltört',
            'slug' => 'feltort',
        ])->assertNotFound();

        expect($this->foreign->fresh()->name)->toBe('Idegen');
    });

    it('törlésre 404-et ad, és megmarad', function () {
        $this->actingAs($this->user)->deleteJson("/api/v1/websites/{$this->foreign->id}")->assertNotFound();

        $this->assertModelExists($this->foreign);
    });
});

describe('színbeállítások', function () {
    it('létrehozáskor elmenti a kiemelőszínt és az oldaltémát, és visszaadja', function () {
        $this->actingAs($this->user)->postJson('/api/v1/websites', [
            'name' => 'Színes', 'slug' => 'szines', 'accent_color' => '#E11D48', 'page_theme' => 'dark',
        ])
            ->assertCreated()
            ->assertJsonPath('data.accent_color', '#E11D48')
            ->assertJsonPath('data.page_theme', 'dark');
    });

    it('elfogadja a kék és a lila témát', function (string $theme) {
        $this->actingAs($this->user)->postJson('/api/v1/websites', [
            'name' => 'Téma', 'slug' => "tema-{$theme}", 'page_theme' => $theme,
        ])->assertCreated()->assertJsonPath('data.page_theme', $theme);
    })->with(['blue', 'purple']);

    it('megadás nélkül üres (alapértelmezett) marad, módosításkor törölhető', function () {
        $website = Website::factory()->for($this->user)->create(['accent_color' => '#112233', 'page_theme' => 'dark']);

        $this->actingAs($this->user)->putJson("/api/v1/websites/{$website->id}", [
            'name' => $website->name, 'slug' => $website->slug, 'accent_color' => null, 'page_theme' => null,
        ])->assertOk()->assertJsonPath('data.accent_color', null)->assertJsonPath('data.page_theme', null);
    });

    it('az egyedi színpalettát elmenti, visszaadja, és csak az ismert kulcsokat tárolja', function () {
        $this->actingAs($this->user)->postJson('/api/v1/websites', [
            'name' => 'Paletta', 'slug' => 'paletta',
            'palette' => ['background' => '#112233', 'text' => '#FFFFFF', 'primary' => '#ff8800', 'junk' => '#000000'],
        ])
            ->assertCreated()
            ->assertJsonPath('data.palette', ['background' => '#112233', 'text' => '#FFFFFF', 'primary' => '#ff8800']);

        expect(Website::where('slug', 'paletta')->first()->palette)->not->toHaveKey('junk');
    });

    it('a paletta részleges, módosításkor törölhető, megadás nélkül üres', function () {
        $website = Website::factory()->for($this->user)->create(['palette' => ['text' => '#112233']]);

        $this->actingAs($this->user)->putJson("/api/v1/websites/{$website->id}", [
            'name' => $website->name, 'slug' => $website->slug, 'palette' => ['primary' => '#ff0000'],
        ])->assertOk()->assertJsonPath('data.palette', ['primary' => '#ff0000']);

        $this->actingAs($this->user)->putJson("/api/v1/websites/{$website->id}", [
            'name' => $website->name, 'slug' => $website->slug, 'palette' => null,
        ])->assertOk()->assertJsonPath('data.palette', null);

        $this->actingAs($this->user)->postJson('/api/v1/websites', ['name' => 'Új', 'slug' => 'uj'])
            ->assertCreated()->assertJsonPath('data.palette', null);
    });

    it('hibás palettaszínt elutasít', function (string $key, mixed $value) {
        $this->actingAs($this->user)->postJson('/api/v1/websites', [
            'name' => 'X', 'slug' => 'x', 'palette' => [$key => $value],
        ])->assertUnprocessable()->assertJsonValidationErrors("palette.$key");
    })->with([
        'rövid hex' => ['background', '#fff'],
        'színnév' => ['text', 'red'],
        'CSS-injekció' => ['primary', '#ffffff;}</style><script>alert(1)</script>'],
        'tömb' => ['text', ['#ffffff']],
    ]);

    it('a paletta nem tömb értékét elutasítja', function () {
        $this->actingAs($this->user)->postJson('/api/v1/websites', [
            'name' => 'X', 'slug' => 'x', 'palette' => '#ffffff',
        ])->assertUnprocessable()->assertJsonValidationErrors('palette');
    });

    it('hibás színt és témát elutasít', function (string $field, string $value) {
        $this->actingAs($this->user)->postJson('/api/v1/websites', [
            'name' => 'X', 'slug' => 'x', $field => $value,
        ])->assertUnprocessable()->assertJsonValidationErrors($field);
    })->with([
        'rövid hex' => ['accent_color', '#fff'],
        'színnév' => ['accent_color', 'red'],
        'CSS-injekció' => ['accent_color', '#ffffff;}</style><script>alert(1)</script>'],
        'ismeretlen téma' => ['page_theme', 'kek'],
    ]);
});
