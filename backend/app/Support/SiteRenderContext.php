<?php

namespace App\Support;

use App\Http\Requests\StoreWebsiteRequest;
use App\Models\Page;
use App\Models\Website;
use Illuminate\Support\Collection;

/**
 * A publikált oldal Blade-sablonjának segédje: oldalcímek, a gombok URL-jének ellenőrzése és a színek.
 */
class SiteRenderContext
{
    public const DEFAULT_ACCENT = '#2f5bea';

    private const PALETTES = [
        'light' => ['bg' => '#ffffff', 'text' => '#1f2328', 'border' => '#d1d9e0'],
        'dark' => ['bg' => '#0f1115', 'text' => '#e6e8ec', 'border' => '#2b313c'],
        'blue' => ['bg' => '#eef4ff', 'text' => '#10264a', 'border' => '#bcd0f2'],
        'purple' => ['bg' => '#f5f0ff', 'text' => '#261448', 'border' => '#cdbdf0'],
    ];

    /** Témánkénti alapértelmezett kiemelőszín; a megadott `accent_color` felülírja. */
    private const ACCENTS = [
        'blue' => '#1d5fd1',
        'purple' => '#6d3fd0',
    ];

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

    /** Az engedélyezett ikon SVG-je; ismeretlen vagy hibás érték esetén üres (felhasználói SVG sosem kerül ki). */
    public function icon(mixed $name): string
    {
        return Icons::svg($name);
    }

    /**
     * A kártyacsoport kártyái futáskor is korlátozva: csak tömb elemek, legfeljebb a megengedett darabszám.
     *
     * @param  array<string, mixed>  $component
     * @return list<array<string, mixed>>
     */
    public function cards(array $component): array
    {
        $cards = is_array($component['cards'] ?? null) ? $component['cards'] : [];

        return array_slice(array_values(array_filter($cards, 'is_array')), 0, PageContentRules::MAX_CARDS);
    }

    /**
     * A becsukható részek futáskor is korlátozva: csak tömb elemek, legfeljebb a megengedett darabszám.
     *
     * @param  array<string, mixed>  $component
     * @return list<array<string, mixed>>
     */
    public function accordionItems(array $component): array
    {
        $items = is_array($component['items'] ?? null) ? $component['items'] : [];

        return array_slice(array_values(array_filter($items, 'is_array')), 0, PageContentRules::MAX_ACCORDION_ITEMS);
    }

    /** A címsor szemantikus szintje 1–6 közé szorítva (a validáció a számot szövegként is elfogadja, ezért az egészre alakítás). */
    public function headingLevel(array $component): int
    {
        return min(PageContentRules::HEADING_MAX_LEVEL, max(1, (int) ($component['level'] ?? 2)));
    }

    /** A kártyacsoport osztályai (`cards` + elrendezési módosítók); csak az engedélyezett értékekből. */
    public function cardsClass(array $component): string
    {
        return $this->modifierClass('cards', $component, PageContentRules::CARDS_OPTIONS);
    }

    /** Az elválasztó osztályai (`divider` + módosítók); csak az engedélyezett értékekből. */
    public function dividerClass(array $component): string
    {
        return $this->modifierClass('divider', $component, PageContentRules::DIVIDER_OPTIONS);
    }

    /**
     * Az alaposztály és a módosítók (`alap--beallitas-ertek`); ismeretlen vagy hibás érték elmarad.
     *
     * @param  array<string, list<int|string>>  $options
     */
    private function modifierClass(string $base, array $component, array $options): string
    {
        $classes = [$base];
        foreach ($options as $option => $allowed) {
            $value = $component[$option] ?? null;
            if ((is_int($value) || is_string($value)) && in_array($value, $allowed, true)) {
                $classes[] = $base.'--'.str_replace('_', '-', $option).'-'.$value;
            }
        }

        return implode(' ', $classes);
    }

    /** A címsor megjelenési osztályai; csak az engedélyezett értékekből, így hibás adat nem kerülhet a HTML-be. */
    public function headingClass(array $component): string
    {
        $classes = [];
        if (in_array($component['size'] ?? null, PageContentRules::HEADING_SIZES, true)) {
            $classes[] = 'heading--'.$component['size'];
        }
        if (in_array($component['align'] ?? null, PageContentRules::HEADING_ALIGNS, true)) {
            $classes[] = 'heading--'.$component['align'];
        }

        return implode(' ', $classes);
    }

    /** A gomb megjelenési osztályai (`button` alap + módosítók); csak az engedélyezett értékekből. */
    public function buttonClass(array $component): string
    {
        $classes = ['button'];
        $options = [
            'style' => PageContentRules::BUTTON_STYLES,
            'size' => PageContentRules::BUTTON_SIZES,
            'radius' => PageContentRules::BUTTON_RADII,
        ];
        foreach ($options as $key => $allowed) {
            if (in_array($component[$key] ?? null, $allowed, true)) {
                $classes[] = 'button--'.($key === 'radius' ? 'r-' : '').$component[$key];
            }
        }

        return implode(' ', $classes);
    }

    /** A gombot tartalmazó bekezdés igazítási osztálya, vagy üres. */
    public function buttonWrapClass(array $component): string
    {
        return in_array($component['align'] ?? null, PageContentRules::BUTTON_ALIGNS, true)
            ? 'button-wrap--'.$component['align']
            : '';
    }

    /** Futáskor is ellenőrizzük a komponens URL-jét (a validációval azonos szabály). */
    public function isSafeUrl(mixed $url): bool
    {
        return is_string($url) && preg_match(PageContentRules::URL_PATTERN, $url) === 1;
    }

    /** Csak érvényes #RRGGBB érték kerülhet a CSS-be; egyébként az alapértelmezett. */
    public function accent(): string
    {
        $color = $this->website->accent_color;

        return is_string($color) && preg_match(StoreWebsiteRequest::COLOR_PATTERN, $color) === 1
            ? strtolower($color)
            : (self::ACCENTS[$this->website->page_theme] ?? self::DEFAULT_ACCENT);
    }

    /** A kiemelőszínű felületen olvasható szövegszín (a relatív fényességből). */
    public function onAccent(): string
    {
        [$r, $g, $b] = array_map(
            fn (string $channel) => hexdec($channel) / 255,
            str_split(ltrim($this->accent(), '#'), 2),
        );
        $linear = fn (float $c) => $c <= 0.03928 ? $c / 12.92 : (($c + 0.055) / 1.055) ** 2.4;
        $luminance = 0.2126 * $linear($r) + 0.7152 * $linear($g) + 0.0722 * $linear($b);

        return $luminance > 0.179 ? '#000000' : '#ffffff';
    }

    /**
     * @return array{bg: string, text: string, border: string}
     */
    public function palette(): array
    {
        return self::PALETTES[$this->website->page_theme] ?? self::PALETTES['light'];
    }
}
