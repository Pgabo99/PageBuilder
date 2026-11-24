<?php

use App\Enums\PublishStatus;
use App\Jobs\PublishWebsite;
use App\Jobs\RemovePublishedSite;
use App\Models\Page;
use App\Models\User;
use App\Models\Website;
use App\Services\SitePublisher;
use App\Support\Icons;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->dir = sys_get_temp_dir().'/pb-publish-'.bin2hex(random_bytes(4));
    config(['publishing.path' => $this->dir]);

    $this->user = User::factory()->create();
    $this->website = Website::factory()->for($this->user)->create(['slug' => 'proba']);
    $this->index = Page::factory()->for($this->website)->create([
        'title' => 'Kezdőlap',
        'slug' => 'kezdolap',
        'position' => 1,
        'content' => [
            ['id' => 'a', 'type' => 'heading', 'text' => 'Üdvözöllek', 'level' => 1],
            ['id' => 'b', 'type' => 'text', 'text' => 'Első bekezdés'],
            ['id' => 'c', 'type' => 'button', 'label' => 'Kapcsolat', 'url' => '/sites/proba/kapcsolat/'],
        ],
    ]);
    $this->contact = Page::factory()->for($this->website)->create([
        'title' => 'Kapcsolat', 'slug' => 'kapcsolat', 'position' => 2, 'content' => [],
    ]);
});

afterEach(fn () => (new Filesystem)->deleteDirectory($this->dir));

function runJob(Website $website): void
{
    (new PublishWebsite($website->id))->handle(app(SitePublisher::class));
}

describe('végpont', function () {
    it('sorba állítja a publikálást, és 202-t ad', function () {
        Queue::fake();

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/publish")
            ->assertAccepted()
            ->assertJsonPath('data.publish_status', 'queued');

        Queue::assertPushed(PublishWebsite::class, fn ($job) => $job->websiteId === $this->website->id);
        expect($this->website->fresh()->publish_status)->toBe(PublishStatus::Queued);
    });

    it('bejelentkezés nélkül 401-et ad', function () {
        $this->postJson("/api/v1/websites/{$this->website->id}/publish")->assertUnauthorized();
    });

    it('idegen webhelyre 404-et ad, és nem sorba állít', function () {
        Queue::fake();
        $other = User::factory()->create();

        $this->actingAs($other)->postJson("/api/v1/websites/{$this->website->id}/publish")->assertNotFound();

        Queue::assertNothingPushed();
    });

    it('oldal nélküli webhelyre 422-t ad', function () {
        Queue::fake();
        $empty = Website::factory()->for($this->user)->create();

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$empty->id}/publish")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('pages');

        Queue::assertNothingPushed();
    });

    it('folyamatban lévő publikálásnál 409-et ad, beragadt állapotnál újra engedi', function () {
        Queue::fake();
        Website::whereKey($this->website->id)->update(['publish_status' => 'running']);

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/publish")->assertStatus(409);

        Website::whereKey($this->website->id)->update(['updated_at' => now()->subMinutes(10)]);

        $this->actingAs($this->user)->postJson("/api/v1/websites/{$this->website->id}/publish")->assertAccepted();
    });
});

describe('job', function () {
    it('az oldalakat statikus fájlokba írja, és sikeresre állítja az állapotot', function () {
        runJob($this->website);

        $index = file_get_contents("{$this->dir}/proba/index.html");
        expect($index)
            ->toContain('<h1>Üdvözöllek</h1>')
            ->toContain('<p>Első bekezdés</p>')
            ->toContain('href="/sites/proba/kapcsolat/"');
        expect(file_exists("{$this->dir}/proba/kapcsolat/index.html"))->toBeTrue();
        // A kezdőlapnak nincs külön alkönyvtára.
        expect(is_dir("{$this->dir}/proba/kezdolap"))->toBeFalse();

        $website = $this->website->fresh();
        expect($website)
            ->publish_status->toBe(PublishStatus::Succeeded)
            ->published_slug->toBe('proba')
            ->publish_error->toBeNull()
            ->and($website->published_at)->not->toBeNull();
    });

    it('a felhasználói tartalmat escape-eli, és nem hivatkoz nem biztonságos URL-re', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'heading', 'text' => '<script>alert(1)</script>', 'level' => 1],
            ['id' => 'b', 'type' => 'text', 'text' => '"><img src=x onerror=alert(1)>'],
            // A validációt megkerülve tárolt rossz adat: a renderer is védekezik.
            ['id' => 'c', 'type' => 'button', 'label' => 'Rossz', 'url' => 'javascript:alert(1)'],
            ['id' => 'd', 'type' => 'button', 'label' => 'Jó', 'url' => 'https://example.com/?a=1&b="2"'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->not->toContain('<img')
            ->not->toContain('javascript:')
            ->not->toContain('Rossz')
            ->toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
            ->toContain('href="https://example.com/?a=1&amp;b=&quot;2&quot;"');
    });

    it('a címsor ikonja inline SVG-ként, a kiemelőszínnel jelenik meg', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'heading', 'text' => 'Kapcsolat', 'level' => 2, 'icon' => 'mail'],
            ['id' => 'b', 'type' => 'heading', 'text' => 'Ikon nélkül', 'level' => 2],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<h2><svg class="icon" viewBox="0 0 24 24"')
            ->toContain('aria-hidden="true"')
            ->toContain(Icons::markup('mail').'</svg>Kapcsolat</h2>')
            ->toContain('<h2>Ikon nélkül</h2>')
            ->toContain('.icon {')
            ->toContain('color: var(--accent)')
            ->not->toContain('<script');
    });

    it('a címsor szintje, mérete és igazítása egymástól függetlenül, osztályként jelenik meg', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'heading', 'text' => 'Hatos nagyban', 'level' => 6, 'size' => 'xlarge', 'align' => 'center'],
            ['id' => 'b', 'type' => 'heading', 'text' => 'Egyes kicsiben', 'level' => 1, 'size' => 'small'],
            ['id' => 'c', 'type' => 'heading', 'text' => 'Csak igazítás', 'level' => 3, 'align' => 'right'],
            ['id' => 'd', 'type' => 'heading', 'text' => 'Régi', 'level' => 2],
            ['id' => 'e', 'type' => 'heading', 'text' => 'Üres', 'level' => '4', 'size' => null, 'align' => null],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<h6 class="heading--xlarge heading--center">Hatos nagyban</h6>')
            ->toContain('<h1 class="heading--small">Egyes kicsiben</h1>')
            ->toContain('<h3 class="heading--right">Csak igazítás</h3>')
            ->toContain('<h2>Régi</h2>')
            ->toContain('<h4>Üres</h4>')
            ->toContain('.heading--xlarge {')
            ->toContain('.heading--center {');
    });

    it('a hibás tárolt címsorbeállítás nem kerül a HTML-be (a validációt megkerülve sem)', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'heading', 'text' => 'Egy', 'level' => 9, 'size' => '"><script>alert(1)</script>', 'align' => ['x']],
            ['id' => 'b', 'type' => 'heading', 'text' => 'Kettő', 'level' => 0, 'size' => 'huge'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->toContain('<h6>Egy</h6>')
            ->toContain('<h1>Kettő</h1>');
    });

    it('az ismeretlen vagy hibás tárolt ikon nem renderelődik (a validációt megkerülve sem)', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'heading', 'text' => 'Egy', 'level' => 2, 'icon' => '<script>alert(1)</script>'],
            ['id' => 'b', 'type' => 'heading', 'text' => 'Kettő', 'level' => 2, 'icon' => ['star']],
            ['id' => 'c', 'type' => 'heading', 'text' => 'Három', 'level' => 2, 'icon' => 'nincs-ilyen'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->not->toContain('<svg')
            ->toContain('<h2>Egy</h2>')
            ->toContain('<h2>Kettő</h2>')
            ->toContain('<h2>Három</h2>');
    });

    it('a kártyacsoport reszponzív rácsban, ikonnal, escape-elt szöveggel és biztonságos gombbal jelenik meg', function () {
        $this->index->update(['content' => [
            ['id' => 'k', 'type' => 'cards', 'cards' => [
                ['id' => 'a', 'icon' => 'star', 'title' => '<b>Első</b>', 'text' => '"><img src=x onerror=1>', 'label' => 'Tovább', 'url' => 'https://example.com/?a=1&b=2'],
                ['id' => 'b', 'title' => 'Csak cím'],
            ]],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr))')
            ->toContain('<div class="cards">')
            ->toContain('<article class="card">')
            ->toContain('<div class="card__icon"><svg class="icon"')
            ->toContain('<h3>&lt;b&gt;Első&lt;/b&gt;</h3>')
            ->toContain('<p>&quot;&gt;&lt;img src=x onerror=1&gt;</p>')
            ->toContain('<a class="button" href="https://example.com/?a=1&amp;b=2">Tovább</a>')
            ->toContain('<h3>Csak cím</h3>')
            ->not->toContain('<img')
            ->not->toContain('<script');
        expect(substr_count($html, '<article class="card">'))->toBe(2)
            // Csak az első kártyának van ikonja és gombja.
            ->and(substr_count($html, 'class="card__icon"'))->toBe(1)
            ->and(substr_count($html, 'class="button"'))->toBe(1);
    });

    it('a kártya gombja csak biztonságos céllal és felirattal jelenik meg (a validációt megkerülve is)', function () {
        $this->index->update(['content' => [
            ['id' => 'k', 'type' => 'cards', 'cards' => [
                ['id' => 'a', 'title' => 'Rossz cél', 'label' => 'Rossz', 'url' => 'javascript:alert(1)'],
                ['id' => 'b', 'title' => 'Felirat nélkül', 'url' => '/x'],
                ['id' => 'c', 'title' => 'Cél nélkül', 'label' => 'Üres'],
                ['id' => 'd', 'icon' => 'nincs-ilyen', 'title' => 'Ismeretlen ikon'],
            ]],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('javascript:')
            ->not->toContain('class="button"')
            ->not->toContain('<svg')
            ->not->toContain('card__icon"')
            ->toContain('<h3>Rossz cél</h3>')
            ->toContain('<h3>Ismeretlen ikon</h3>');
    });

    it('legfeljebb hat kártyát renderel, és a hibás kártyaadat nem töri meg a publikálást', function () {
        $many = array_map(fn ($i) => ['id' => "k$i", 'title' => "Kártya $i"], range(1, 9));
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'cards', 'cards' => $many],
            ['id' => 'b', 'type' => 'cards', 'cards' => 'nem tömb'],
            ['id' => 'c', 'type' => 'cards', 'cards' => ['szöveg', 7, ['id' => 'x', 'title' => 'Jó']]],
            ['id' => 'd', 'type' => 'cards'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($this->website->fresh()->publish_status)->toBe(PublishStatus::Succeeded)
            ->and(substr_count($html, '<h3>Kártya '))->toBe(6)
            ->and($html)->not->toContain('Kártya 7')
            ->and($html)->toContain('<h3>Jó</h3>')
            ->and(substr_count($html, '<div class="cards">'))->toBe(4);
    });

    it('a becsukható részek natív details/summary elemek, alapból zártak, JavaScript nélkül', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'accordion', 'items' => [
                ['id' => 'i1', 'title' => '<b>Kérdés</b>', 'text' => '"><img src=x onerror=1>'],
                ['id' => 'i2', 'title' => 'Másik', 'text' => 'Válasz'],
            ]],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<div class="accordion">')
            ->toContain('<summary>&lt;b&gt;Kérdés&lt;/b&gt;</summary>')
            ->toContain('<p>&quot;&gt;&lt;img src=x onerror=1&gt;</p>')
            ->toContain('<summary>Másik</summary>')
            ->not->toContain('<details open')
            ->not->toContain('<script')
            ->not->toContain('<img')
            ->not->toContain('onclick');
        expect(substr_count($html, '<details>'))->toBe(2)
            ->and(substr_count($html, '</details>'))->toBe(2);
    });

    it('legfeljebb húsz részt renderel, és a hibás részadat nem töri meg a publikálást', function () {
        $many = array_map(fn ($i) => ['id' => "i$i", 'title' => "Rész $i", 'text' => 'Szöveg'], range(1, 25));
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'accordion', 'items' => $many],
            ['id' => 'b', 'type' => 'accordion', 'items' => 'nem tömb'],
            ['id' => 'c', 'type' => 'accordion', 'items' => ['szöveg', 7, ['id' => 'x', 'title' => 'Jó', 'text' => 'Rész']]],
            ['id' => 'd', 'type' => 'accordion'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($this->website->fresh()->publish_status)->toBe(PublishStatus::Succeeded)
            ->and(substr_count($html, '<summary>Rész '))->toBe(20)
            ->and($html)->not->toContain('Rész 21')
            ->and($html)->toContain('<summary>Jó</summary>')
            ->and(substr_count($html, '<div class="accordion">'))->toBe(4);
    });

    it('idempotens: ismételt futtatás ugyanazt adja, és nem hagy ideiglenes könyvtárat', function () {
        runJob($this->website);
        $first = file_get_contents("{$this->dir}/proba/index.html");

        runJob($this->website);

        expect(file_get_contents("{$this->dir}/proba/index.html"))->toBe($first);
        expect(array_values(array_diff(scandir($this->dir), ['.', '..'])))->toBe(['proba']);
    });

    it('slugváltáskor a régi könyvtárat törli', function () {
        runJob($this->website);

        $this->website->update(['slug' => 'uj-nev']);
        runJob($this->website->fresh());

        expect(is_dir("{$this->dir}/proba"))->toBeFalse();
        expect(file_exists("{$this->dir}/uj-nev/index.html"))->toBeTrue();
        expect($this->website->fresh()->published_slug)->toBe('uj-nev');
    });

    it('hiba esetén az előző verzió érintetlen, a végső hibaállapot általános üzenetet ad', function () {
        runJob($this->website);
        $before = file_get_contents("{$this->dir}/proba/index.html");
        Page::where('website_id', $this->website->id)->delete();

        $exception = null;
        try {
            runJob($this->website);
        } catch (Throwable $e) {
            $exception = $e;
        }

        expect($exception)->not->toBeNull();
        expect(file_get_contents("{$this->dir}/proba/index.html"))->toBe($before);

        (new PublishWebsite($this->website->id))->failed($exception);

        $website = $this->website->fresh();
        expect($website->publish_status)->toBe(PublishStatus::Failed);
        expect($website->publish_error)->not->toContain($exception->getMessage());
    });

    it('nem létező webhelynél nem hibázik', function () {
        (new PublishWebsite(999_999))->handle(app(SitePublisher::class));

        expect(is_dir($this->dir))->toBeFalse();
    });
});

describe('állapot és takarítás', function () {
    it('a sikeres publikálás után megadja a publikus útvonalat', function () {
        runJob($this->website);

        $this->actingAs($this->user)->getJson("/api/v1/websites/{$this->website->id}")
            ->assertOk()
            ->assertJsonPath('data.publish_status', 'succeeded')
            ->assertJsonPath('data.published_url', '/sites/proba/');
    });

    it('a webhely törlésekor a publikált könyvtár is törlődik', function () {
        runJob($this->website);

        $this->actingAs($this->user)->deleteJson("/api/v1/websites/{$this->website->id}")->assertNoContent();

        expect(is_dir("{$this->dir}/proba"))->toBeFalse();
    });

    it('a törlés a workerre bízza a könyvtár eltávolítását (a webes kérés nem ír a kötetre)', function () {
        runJob($this->website);
        Queue::fake();

        $this->actingAs($this->user)->deleteJson("/api/v1/websites/{$this->website->id}")->assertNoContent();

        Queue::assertPushed(RemovePublishedSite::class, fn ($job) => $job->slug === 'proba');
        expect(is_dir("{$this->dir}/proba"))->toBeTrue();
    });

    it('publikálatlan webhely törlésekor nem állít sorba törlést', function () {
        Queue::fake();
        $unpublished = Website::factory()->for($this->user)->create();

        $this->actingAs($this->user)->deleteJson("/api/v1/websites/{$unpublished->id}")->assertNoContent();

        Queue::assertNothingPushed();
    });

    it('a törlő job nem töröl, ha a webcímet közben másik webhely publikálta', function () {
        runJob($this->website);
        $other = Website::factory()->for($this->user)->create(['slug' => 'masik']);
        $other->forceFill(['published_slug' => 'proba'])->save();
        $this->website->delete();

        (new RemovePublishedSite('proba'))->handle(app(SitePublisher::class));

        expect(is_dir("{$this->dir}/proba"))->toBeTrue();
    });

    it('a törlő job csak érvényes webcímet fogad el, a gyökéren kívülre nem nyúl', function () {
        $outside = dirname($this->dir).'/pb-outside-'.bin2hex(random_bytes(3));
        mkdir($outside);
        $relative = '../'.basename($outside);

        (new RemovePublishedSite($relative))->handle(app(SitePublisher::class));

        expect(is_dir($outside))->toBeTrue();
        rmdir($outside);
    });
});

describe('színek a publikált oldalon', function () {
    it('a beállított kiemelőszínt és az oldaltémát használja', function () {
        $this->website->update(['accent_color' => '#E11D48', 'page_theme' => 'dark']);

        runJob($this->website);

        expect(file_get_contents("{$this->dir}/proba/index.html"))
            ->toContain('--accent: #e11d48')
            ->toContain('--bg: #0f1115')
            ->toContain('--text: #e6e8ec');
    });

    it('a kék és a lila téma saját palettát és alapértelmezett kiemelőszínt kap', function (string $theme, array $expected) {
        $this->website->update(['page_theme' => $theme]);

        runJob($this->website);

        expect(file_get_contents("{$this->dir}/proba/index.html"))->toContain(...$expected);
    })->with([
        'kék' => ['blue', ['--bg: #eef4ff', '--text: #10264a', '--accent: #1d5fd1', '--on-accent: #ffffff']],
        'lila' => ['purple', ['--bg: #f5f0ff', '--text: #261448', '--accent: #6d3fd0', '--on-accent: #ffffff']],
    ]);

    it('a megadott kiemelőszín a téma alapértelmezettjét is felülírja', function () {
        $this->website->update(['page_theme' => 'purple', 'accent_color' => '#E11D48']);

        runJob($this->website);

        expect(file_get_contents("{$this->dir}/proba/index.html"))
            ->toContain('--accent: #e11d48')
            ->toContain('--bg: #f5f0ff');
    });

    it('alapértelmezett megjelenés, ha nincs beállítás', function () {
        runJob($this->website);

        expect(file_get_contents("{$this->dir}/proba/index.html"))
            ->toContain('--accent: #2f5bea')
            ->toContain('--bg: #ffffff');
    });

    it('a gomb szövegszíne olvasható: világos kiemelőn fekete, sötétén fehér', function (string $accent, string $expected) {
        $this->website->update(['accent_color' => $accent]);

        runJob($this->website);

        expect(file_get_contents("{$this->dir}/proba/index.html"))->toContain("--on-accent: {$expected}");
    })->with([
        'sárga' => ['#FFE600', '#000000'],
        'sötétkék' => ['#112244', '#ffffff'],
    ]);

    it('a validációt megkerülő hibás tárolt érték nem kerül a CSS-be', function () {
        Website::whereKey($this->website->id)->update([
            // Az oszlop mérete is korlátoz (7 és 16 karakter), de a renderer ettől függetlenül is ellenőriz.
            'accent_color' => 'x;}<b>',
            'page_theme' => 'kek',
        ]);

        runJob($this->website->fresh());

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('x;}<b>')
            ->toContain('--accent: #2f5bea')
            ->toContain('--bg: #ffffff');
    });
});
