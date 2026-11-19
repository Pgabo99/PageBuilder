<?php

namespace App\Services;

use App\Http\Requests\StoreWebsiteRequest;
use App\Models\Website;
use App\Support\SiteRenderContext;
use Illuminate\Filesystem\Filesystem;
use RuntimeException;

/**
 * Egy webhely oldalainak statikus HTML-lé renderelése és az élő könyvtár cseréje.
 * A kimenet előbb ideiglenes könyvtárba készül, így hiba esetén az előző verzió érintetlen marad.
 */
class SitePublisher
{
    public function __construct(private readonly Filesystem $files) {}

    public function publish(Website $website): void
    {
        $pages = $website->pages()->get();

        if ($pages->isEmpty()) {
            throw new RuntimeException('A webhelynek nincs oldala.');
        }

        $context = new SiteRenderContext($website, $pages);
        $target = $this->directory($website->slug);
        $token = bin2hex(random_bytes(6));
        $staging = $this->directory(".{$website->slug}.new-{$token}");
        $previous = $this->directory(".{$website->slug}.old-{$token}");

        try {
            $this->files->ensureDirectoryExists($staging, 0755);

            foreach ($pages as $page) {
                $html = view('site.page', ['website' => $website, 'page' => $page, 'pages' => $pages, 'site' => $context])->render();
                $dir = $context->isIndex($page) ? $staging : $staging.'/'.$page->slug;
                $this->files->ensureDirectoryExists($dir, 0755);

                if ($this->files->put($dir.'/index.html', $html) === false) {
                    throw new RuntimeException('Az oldal írása sikertelen.');
                }
            }

            $this->swap($staging, $target, $previous);
        } finally {
            $this->files->deleteDirectory($staging);
            $this->files->deleteDirectory($previous);
        }
    }

    /** A publikált könyvtár törlése (webhely törlésekor, slugváltáskor). */
    public function remove(string $slug): void
    {
        // Csak érvényes webcím: a kapott érték nem hagyhatja el a publikálási gyökeret.
        if (preg_match(StoreWebsiteRequest::SLUG_PATTERN, $slug) !== 1) {
            return;
        }

        $this->files->deleteDirectory($this->directory($slug));
    }

    private function swap(string $staging, string $target, string $previous): void
    {
        $hadPrevious = $this->files->isDirectory($target);

        if ($hadPrevious && ! rename($target, $previous)) {
            throw new RuntimeException('A régi verzió eltávolítása sikertelen.');
        }

        if (! rename($staging, $target)) {
            // Visszaállítjuk az előző verziót.
            if ($hadPrevious) {
                rename($previous, $target);
            }

            throw new RuntimeException('Az új verzió aktiválása sikertelen.');
        }
    }

    private function directory(string $name): string
    {
        return rtrim(config('publishing.path'), '/').'/'.$name;
    }
}
