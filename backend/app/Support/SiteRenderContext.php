<?php

namespace App\Support;

use App\Models\Page;
use App\Models\Website;
use Illuminate\Support\Collection;

/**
 * A publikált oldal Blade-sablonjának segédje: oldalcímek és a gombok URL-jének ellenőrzése.
 */
class SiteRenderContext
{
    /**
     * @param  Collection<int, Page>  $pages  pozíció szerint rendezve; az első a kezdőlap
     */
    public function __construct(
        public readonly Website $website,
        public readonly Collection $pages,
    ) {}

    public function isIndex(Page $page): bool
    {
        return $this->pages->first()?->is($page) ?? false;
    }

    public function urlFor(Page $page): string
    {
        $base = '/sites/'.$this->website->slug.'/';

        return $this->isIndex($page) ? $base : $base.$page->slug.'/';
    }

    /** Futáskor is ellenőrizzük a komponens URL-jét (a validációval azonos szabály). */
    public function isSafeUrl(mixed $url): bool
    {
        return is_string($url) && preg_match(PageContentRules::URL_PATTERN, $url) === 1;
    }
}
