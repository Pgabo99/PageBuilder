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

    it('a gomb stílusa, mérete, lekerekítése és igazítása osztályként jelenik meg', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'button', 'label' => 'Egy', 'url' => '/x', 'style' => 'outline', 'size' => 'large', 'radius' => 'full', 'align' => 'center'],
            ['id' => 'b', 'type' => 'button', 'label' => 'Kettő', 'url' => '/y', 'style' => 'link'],
            ['id' => 'c', 'type' => 'button', 'label' => 'Három', 'url' => '/z', 'style' => null, 'size' => null, 'align' => null, 'radius' => null],
            ['id' => 'd', 'type' => 'button', 'label' => 'Négy', 'url' => '/w'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<p class="button-wrap--center"><a class="button button--outline button--large button--r-full" href="/x">Egy</a></p>')
            ->toContain('<p><a class="button button--link" href="/y">Kettő</a></p>')
            ->toContain('<p><a class="button" href="/z">Három</a></p>')
            ->toContain('<p><a class="button" href="/w">Négy</a></p>')
            ->toContain('.button--outline {')
            ->toContain('.button-wrap--right {');
    });

    it('a hibás tárolt gombbeállítás nem kerül a HTML-be (a validációt megkerülve sem)', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'button', 'label' => 'Egy', 'url' => '/x', 'style' => '"><script>alert(1)</script>', 'size' => ['x'], 'align' => 'justify', 'radius' => 'round'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->toContain('<p><a class="button" href="/x">Egy</a></p>');
    });

    it('a kártyacsoport elrendezése osztályként jelenik meg, az alapértelmezett nem kap osztályt', function () {
        $card = ['id' => 'a', 'title' => 'Első', 'label' => 'Tovább', 'url' => '/x'];
        $this->index->update(['content' => [
            ['id' => 'k', 'type' => 'cards', 'cards' => [$card], 'columns' => 3, 'icon_position' => 'top-center', 'shadow' => 'medium', 'button_position' => 'right', 'gap' => 'large'],
            ['id' => 'l', 'type' => 'cards', 'cards' => [$card]],
            ['id' => 'm', 'type' => 'cards', 'cards' => [$card], 'columns' => null, 'radius' => null],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<div class="cards cards--columns-3 cards--icon-position-top-center cards--shadow-medium cards--button-position-right cards--gap-large">')
            ->toContain('<p class="card__action"><a class="button" href="/x">Tovább</a></p>')
            ->and(substr_count($html, '<div class="cards">'))->toBe(2)
            ->and($html)->toContain('.cards--columns-3 {')
            ->toContain('.cards--icon-position-left .card');
    });

    it('a hibás tárolt kártyaelrendezés nem kerül a HTML-be (a validációt megkerülve sem)', function () {
        $this->index->update(['content' => [
            ['id' => 'k', 'type' => 'cards', 'cards' => [['id' => 'a', 'title' => 'X']], 'columns' => 9, 'gap' => '"><script>alert(1)</script>', 'shadow' => ['small'], 'radius' => 'round', 'icon_size' => true],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->toContain('<div class="cards">');
    });

    it('a lábléc az oldal végén, a tartalom után jelenik meg, hivatkozásokkal és escape-elt szöveggel', function () {
        $this->index->update(['content' => [
            ['id' => 'f', 'type' => 'footer', 'copyright' => '© <b>Teszt</b>', 'email' => 'info@example.com', 'phone' => '+36 (30) 123-4567', 'address' => '"><img src=x onerror=1>',
                'links' => [['id' => 'a', 'label' => 'Kapcsolat', 'url' => '/sites/proba/kapcsolat/'], ['id' => 'b', 'label' => 'Külső', 'url' => 'https://example.com/?a=1&b=2']]],
            ['id' => 't', 'type' => 'text', 'text' => 'Tartalom'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<footer class="site-footer">')
            ->toContain('<nav aria-label="Lábléc">')
            ->toContain('<a href="/sites/proba/kapcsolat/">Kapcsolat</a>')
            ->toContain('<a href="https://example.com/?a=1&amp;b=2">Külső</a>')
            ->toContain('<a href="mailto:info@example.com">info@example.com</a>')
            ->toContain('<a href="tel:+36301234567">+36 (30) 123-4567</a>')
            ->toContain('&lt;b&gt;Teszt&lt;/b&gt;')
            ->toContain('&quot;&gt;&lt;img src=x onerror=1&gt;')
            ->not->toContain('<img')
            ->and(substr_count($html, '<footer'))->toBe(1)
            // A lábléc a </main> után van, a tartalom sorrendjétől függetlenül.
            ->and(strpos($html, '<footer'))->toBeGreaterThan(strpos($html, '</main>'))
            ->and(strpos($html, 'Tartalom'))->toBeLessThan(strpos($html, '</main>'));
    });

    it('lábléc nélküli oldal változatlan: nincs footer elem, az üres lábléc sem jelenik meg', function () {
        $this->contact->update(['content' => [['id' => 'f', 'type' => 'footer']]]);

        runJob($this->website);

        expect(file_get_contents("{$this->dir}/proba/index.html"))->not->toContain('<footer');
        $contact = file_get_contents("{$this->dir}/proba/kapcsolat/index.html");
        expect($contact)->toContain('<footer class="site-footer">')
            ->not->toContain('<nav aria-label="Lábléc">')
            ->not->toContain('<address>')
            ->not->toContain('site-footer__copyright">');
    });

    it('a hibás tárolt lábléc biztonságosan jelenik meg (a validációt megkerülve sem)', function () {
        $many = array_map(fn ($i) => ['id' => "l$i", 'label' => "Link$i", 'url' => 'https://example.com'], range(1, 12));
        $this->index->update(['content' => [
            ['id' => 'f', 'type' => 'footer', 'email' => '"><script>alert(1)</script>', 'phone' => 'javascript:alert(1)',
                'links' => [['id' => '1', 'label' => 'Rossz', 'url' => 'javascript:alert(1)'], ['id' => '2', 'label' => ['x'], 'url' => 'https://example.com'], 'szöveg', ...$many]],
            ['id' => 'g', 'type' => 'footer', 'copyright' => 'Második', 'links' => 'nem tömb'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->not->toContain('javascript:')
            ->not->toContain('mailto:')
            ->not->toContain('tel:')
            ->not->toContain('Második')
            ->and(substr_count($html, '<footer'))->toBe(1)
            // Előbb a darabszám-korlát (8 elem), aztán a szűrés: a két hibás elem miatt 6 érvényes link marad.
            ->and(substr_count($html, 'href="https://example.com"'))->toBe(6);
    });

    it('az egyedi paletta felülírja a háttér- és szövegszínt, a keretszín ebből számolt, az elsődleges a hivatkozásoké', function () {
        $this->website->update(['palette' => ['background' => '#101820', 'text' => '#F2F2F2', 'primary' => '#FF8800']]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('--bg: #101820')
            ->toContain('--text: #f2f2f2')
            ->toContain('--border: color-mix(in srgb, #f2f2f2 20%, #101820)')
            ->toContain('--primary: #ff8800')
            ->toContain('nav a { color: var(--primary)');
    });

    it('a részleges paletta csak a megadott színt cseréli, az alap a téma és a kiemelőszín', function () {
        $this->website->update(['page_theme' => 'dark', 'accent_color' => '#E11D48', 'palette' => ['text' => '#ffffff']]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('--bg: #0f1115')
            ->toContain('--text: #ffffff')
            ->toContain('--border: color-mix(in srgb, #ffffff 20%, #0f1115)')
            ->toContain('--accent: #e11d48')
            ->toContain('--primary: #e11d48');
    });

    it('paletta nélkül a megjelenés a korábbival azonos: a téma keretszíne és az elsődleges a kiemelőszín', function () {
        $this->website->update(['page_theme' => 'blue']);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('--bg: #eef4ff')
            ->toContain('--border: #bcd0f2')
            ->toContain('--primary: #1d5fd1')
            ->not->toContain('color-mix(in srgb, #');
    });

    it('a hibás tárolt palettaszín nem kerül a CSS-be (a validációt megkerülve sem)', function () {
        $this->website->update(['palette' => [
            'background' => '#fff;}</style><script>alert(1)</script>',
            'text' => ['x'],
            'primary' => 'red',
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->toContain('--bg: #ffffff')
            ->toContain('--text: #1f2328')
            ->toContain('--border: #d1d9e0')
            ->toContain('--primary: #2f5bea');
    });

    it('a közösségi linkek márkaikonnal és olvasható névvel jelennek meg, rel=noopener noreferrer', function () {
        $this->index->update(['content' => [
            ['id' => 's', 'type' => 'social', 'items' => [
                ['id' => 'a', 'platform' => 'github', 'url' => 'https://github.com/pagebuilder?a=1&b=2'],
                ['id' => 'b', 'platform' => 'twitter', 'url' => '/kapcsolat/'],
            ]],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<ul class="social">')
            ->toContain('<a class="social__link" href="https://github.com/pagebuilder?a=1&amp;b=2" rel="noopener noreferrer"><svg class="icon"')
            ->toContain('<span class="visually-hidden">GitHub</span>')
            ->toContain('<span class="visually-hidden">Twitter / X</span>')
            ->toContain(Icons::brandMarkup('github'))
            ->and(substr_count($html, 'class="social__link"'))->toBe(2);
    });

    it('a hibás tárolt közösségi link kimarad (a validációt megkerülve sem)', function () {
        $many = array_map(fn ($i) => ['id' => "i$i", 'platform' => 'github', 'url' => 'https://example.com'], range(1, 15));
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'social', 'items' => [
                ['id' => '1', 'platform' => 'github', 'url' => 'javascript:alert(1)'],
                ['id' => '2', 'platform' => '"><script>alert(1)</script>', 'url' => 'https://example.com'],
                ['id' => '3', 'platform' => ['x'], 'url' => 'https://example.com'],
                ['id' => '4', 'platform' => 'star', 'url' => 'https://example.com'],
                'szöveg',
                ['id' => '5', 'platform' => 'gitlab', 'url' => 'https://gitlab.com/x'],
            ]],
            ['id' => 'b', 'type' => 'social', 'items' => $many],
            ['id' => 'c', 'type' => 'social', 'items' => 'nem tömb'],
            ['id' => 'd', 'type' => 'social'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->not->toContain('javascript:')
            ->and(substr_count($html, '<ul class="social">'))->toBe(4)
            ->and(substr_count($html, 'class="social__link"'))->toBe(11);
    });

    it('a statisztikák rácsban, ikonnal, előtaggal és utótaggal, escape-elt szöveggel jelennek meg', function () {
        $this->index->update(['content' => [
            ['id' => 's', 'type' => 'stats', 'items' => [
                ['id' => 'a', 'icon' => 'users', 'value' => '120', 'label' => '<b>Ügyfél</b>', 'prefix' => '~', 'suffix' => '+'],
                ['id' => 'b', 'value' => '"><img src=x onerror=1>', 'label' => 'Másik'],
            ]],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<div class="stats">')
            ->toContain('<p class="stat__value">~120+</p>')
            ->toContain('<p class="stat__label">&lt;b&gt;Ügyfél&lt;/b&gt;</p>')
            ->toContain('<p class="stat__value">&quot;&gt;&lt;img src=x onerror=1&gt;</p>')
            ->not->toContain('<img')
            ->and(substr_count($html, 'class="stat__icon"'))->toBe(1)
            ->and(substr_count($html, '<div class="stat">'))->toBe(2)
            ->and($html)->toContain('grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr))');
    });

    it('a hibás tárolt statisztika biztonságosan jelenik meg, a darabszám korlátos (a validációt megkerülve sem)', function () {
        $many = array_map(fn ($i) => ['id' => "i$i", 'value' => (string) $i, 'label' => 'L'], range(1, 10));
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'stats', 'items' => $many],
            ['id' => 'b', 'type' => 'stats', 'items' => 'nem tömb'],
            ['id' => 'c', 'type' => 'stats', 'items' => ['szöveg', 7, ['id' => 'x', 'value' => '1', 'label' => 'Jó', 'icon' => '<script>alert(1)</script>']]],
            ['id' => 'd', 'type' => 'stats'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->not->toContain('<svg')
            ->and(substr_count($html, '<div class="stats">'))->toBe(4)
            ->and(substr_count($html, '<div class="stat">'))->toBe(7);
    });

    it('az idézet blockquote és cite elemekkel, a forráslinkkel jelenik meg, a tartalom escape-elt', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'quote', 'text' => '<b>Idézet</b>', 'author' => '"><img src=x onerror=1>', 'source' => 'Könyv', 'source_url' => 'https://example.com/?a=1&b=2'],
            ['id' => 'b', 'type' => 'quote', 'text' => 'Csak szöveg'],
            ['id' => 'c', 'type' => 'quote', 'text' => 'Link nélkül', 'source' => 'Forrás'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<figure class="quote">')
            ->toContain('<blockquote><p>&lt;b&gt;Idézet&lt;/b&gt;</p></blockquote>')
            ->toContain('&quot;&gt;&lt;img src=x onerror=1&gt;')
            ->toContain('<cite>')
            ->toMatch('~, <cite><a href="https://example.com/\?a=1&amp;b=2">Könyv</a></cite></figcaption>~')
            ->toContain('&quot;&gt;&lt;img src=x onerror=1&gt;, <cite>')
            ->toContain('<a href="https://example.com/?a=1&amp;b=2">Könyv</a>')
            ->toContain('<blockquote><p>Csak szöveg</p></blockquote>')
            ->not->toContain('<img')
            ->and(substr_count($html, '<figcaption>'))->toBe(2)
            ->and(substr_count($html, '<cite>'))->toBe(2)
            ->and(substr_count($html, '<a href="https://example.com'))->toBe(1);
    });

    it('a nem biztonságos tárolt forráslink nem kerül a HTML-be (a validációt megkerülve sem)', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'quote', 'text' => 'Egy', 'source' => 'Rossz', 'source_url' => 'javascript:alert(1)'],
            ['id' => 'b', 'type' => 'quote', 'text' => 'Kettő', 'source' => 'Rossz2', 'source_url' => ['x']],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('javascript:')
            ->toContain('Rossz')
            ->toContain('Rossz2')
            ->and(preg_match('~<cite>\s*<a~', $html))->toBe(0);
    });

    it('az értesítés típusa szövegesen és látható jellel is megjelenik, a tartalom escape-elt', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'alert', 'variant' => 'warning', 'title' => '<b>Figyelem</b>', 'text' => '"><img src=x onerror=1>', 'icon' => 'info'],
            ['id' => 'b', 'type' => 'alert', 'variant' => 'error', 'text' => 'Csak szöveg'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<div class="alert alert--warning" role="note">')
            ->toContain('<span class="visually-hidden">Figyelmeztetés: </span>')
            ->toContain('<strong class="alert__title">&lt;b&gt;Figyelem&lt;/b&gt;</strong>')
            ->toContain('<p>&quot;&gt;&lt;img src=x onerror=1&gt;</p>')
            ->toContain('<span class="alert__icon" aria-hidden="true"><svg class="icon"')
            // Ikon nélkül a típus látható jele jelenik meg.
            ->toContain('<div class="alert alert--error" role="note">')
            ->toContain('<span class="alert__icon" aria-hidden="true">✕</span>')
            ->toContain('<span class="visually-hidden">Hiba: </span>')
            ->not->toContain('<img')
            ->and(substr_count($html, 'alert__title'))->toBe(2); // egy elem + a CSS-szabály
    });

    it('a hibás tárolt értesítés biztonságosan, információként jelenik meg (a validációt megkerülve sem)', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'alert', 'variant' => '"><script>alert(1)</script>', 'text' => 'Egy', 'icon' => '<script>alert(1)</script>'],
            ['id' => 'b', 'type' => 'alert', 'variant' => ['x'], 'text' => 'Kettő'],
            ['id' => 'c', 'type' => 'alert', 'text' => 'Három', 'icon' => ['star']],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->and(substr_count($html, '<div class="alert alert--info" role="note">'))->toBe(3)
            ->and(substr_count($html, '<span class="alert__icon" aria-hidden="true">i</span>'))->toBe(3);
    });

    it('a térköz rem-ben megadott magasságú, a képernyőolvasók elől rejtett elemként jelenik meg', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'spacer', 'height' => 5],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<div class="spacer--5" aria-hidden="true"></div>')
            ->toContain('.spacer--5 { height: 5rem; }')
            ->toContain('.spacer--20 { height: 20rem; }');
    });

    it('a hibás tárolt térköz a megengedett tartományra szorul (a validációt megkerülve sem)', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'spacer', 'height' => 999],
            ['id' => 'b', 'type' => 'spacer', 'height' => -4],
            ['id' => 'c', 'type' => 'spacer', 'height' => '"><script>alert(1)</script>'],
            ['id' => 'd', 'type' => 'spacer'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->toContain('<div class="spacer--20" aria-hidden="true"></div>')
            // A negatív és a nem szám érték a minimumra, a hiányzó az alapértékre szorul.
            ->and(substr_count($html, '<div class="spacer--1" aria-hidden="true"></div>'))->toBe(2)
            ->and(substr_count($html, '<div class="spacer--2" aria-hidden="true"></div>'))->toBe(1);
    });

    it('az elválasztó vízszintes vonalként, osztályokkal jelenik meg; az alapértelmezett osztály nélkül', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'divider', 'thickness' => 'thick', 'style' => 'dotted', 'color' => 'accent'],
            ['id' => 'b', 'type' => 'divider'],
            ['id' => 'c', 'type' => 'divider', 'thickness' => null, 'style' => null],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->toContain('<hr class="divider divider--thickness-thick divider--style-dotted divider--color-accent">')
            ->and(substr_count($html, '<hr class="divider">'))->toBe(2)
            ->and($html)->toContain('.divider--color-accent {');
    });

    it('a hibás tárolt elválasztó-beállítás nem kerül a HTML-be (a validációt megkerülve sem)', function () {
        $this->index->update(['content' => [
            ['id' => 'a', 'type' => 'divider', 'thickness' => '"><script>alert(1)</script>', 'style' => ['x'], 'color' => 'red'],
        ]]);

        runJob($this->website);

        $html = file_get_contents("{$this->dir}/proba/index.html");
        expect($html)
            ->not->toContain('<script')
            ->toContain('<hr class="divider">');
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
