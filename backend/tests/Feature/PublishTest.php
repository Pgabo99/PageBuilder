<?php

use App\Enums\PublishStatus;
use App\Jobs\PublishWebsite;
use App\Jobs\RemovePublishedSite;
use App\Models\Page;
use App\Models\User;
use App\Models\Website;
use App\Services\SitePublisher;
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
            // Az oszlop mérete is korlátoz (7 és 5 karakter), de a renderer ettől függetlenül is ellenőriz.
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
