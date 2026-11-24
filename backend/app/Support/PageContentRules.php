<?php

namespace App\Support;

use Illuminate\Validation\Rule;

/**
 * Az oldal `content` JSON-jának validálási szabályai: komponenstípusonként más mezők.
 * A validated() csak a felsorolt mezőket adja vissza, így az ismeretlenek eldobódnak.
 */
class PageContentRules
{
    public const MAX_COMPONENTS = 100;

    /** Csak http(s), webhelyen belüli útvonal (nem //host) vagy horgony: javascript: és data: tiltott. */
    public const URL_PATTERN = '~^(?:https?://\S+|/(?!/)\S*|#\S*)$~i';

    public const MAX_CARDS = 6;

    public const MAX_ACCORDION_ITEMS = 20;

    public const HEADING_MAX_LEVEL = 6;

    /** A címsor megjelenési mérete és igazítása: előre definiált értékek; az üres érték a szinthez igazodó alapmegjelenés. */
    public const HEADING_SIZES = ['small', 'medium', 'large', 'xlarge'];

    public const HEADING_ALIGNS = ['left', 'center', 'right'];

    /** A gomb megjelenése: előre definiált értékek; az üres érték a jelenlegi (kitöltött, közepes, balra igazított) megjelenés. */
    public const BUTTON_STYLES = ['filled', 'outline', 'soft', 'link'];

    public const BUTTON_SIZES = ['small', 'medium', 'large'];

    public const BUTTON_ALIGNS = ['left', 'center', 'right'];

    public const BUTTON_RADII = ['none', 'small', 'medium', 'full'];

    /**
     * A kártyacsoport elrendezése: beállítás => engedélyezett értékek. Az üres érték a jelenlegi megjelenés
     * (automatikus oszlopok, ikon felül balra, balra igazított szöveg, 1 px keret, nincs árnyék, közepes méretek).
     */
    public const CARDS_OPTIONS = [
        'columns' => [1, 2, 3, 4],
        'icon_position' => ['top-left', 'top-center', 'left', 'right'],
        'icon_size' => ['small', 'medium', 'large'],
        'text_align' => ['left', 'center', 'right'],
        'border' => ['none', 'thin', 'thick'],
        'shadow' => ['none', 'small', 'medium'],
        'radius' => ['none', 'small', 'medium', 'large'],
        'button_position' => ['left', 'center', 'right'],
        'gap' => ['small', 'medium', 'large'],
        'padding' => ['small', 'medium', 'large'],
    ];

    private const TYPES = ['heading', 'text', 'button', 'cards', 'accordion'];

    /**
     * @return array<string, mixed>
     */
    public static function rules(mixed $content): array
    {
        $rules = [
            'content' => ['present', 'array', 'max:'.self::MAX_COMPONENTS],
            'content.*.id' => ['required', 'string', 'max:64'],
            'content.*.type' => ['required', Rule::in(self::TYPES)],
        ];

        if (! is_array($content)) {
            return $rules;
        }

        foreach ($content as $index => $component) {
            $type = is_array($component) ? ($component['type'] ?? null) : null;

            foreach (self::fields($type, $index) as $field => $fieldRules) {
                $rules["content.$index.$field"] = $fieldRules;
            }
        }

        return $rules;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private static function fields(mixed $type, int|string $index): array
    {
        $card = "content.$index.cards.*";
        $cardsLayout = collect(self::CARDS_OPTIONS)
            ->map(fn (array $values, string $option) => [
                'nullable',
                ...($option === 'columns' ? ['integer'] : ['string']),
                Rule::in($values),
            ])
            ->all();

        return match ($type) {
            'heading' => [
                'text' => ['required', 'string', 'max:255'],
                'level' => ['required', 'integer', 'between:1,'.self::HEADING_MAX_LEVEL],
                'size' => ['nullable', 'string', Rule::in(self::HEADING_SIZES)],
                'align' => ['nullable', 'string', Rule::in(self::HEADING_ALIGNS)],
                'icon' => ['nullable', 'string', Rule::in(Icons::names())],
            ],
            'text' => [
                'text' => ['required', 'string', 'max:5000'],
            ],
            'button' => [
                'label' => ['required', 'string', 'max:100'],
                'url' => ['required', 'string', 'max:2048', 'regex:'.self::URL_PATTERN],
                'style' => ['nullable', 'string', Rule::in(self::BUTTON_STYLES)],
                'size' => ['nullable', 'string', Rule::in(self::BUTTON_SIZES)],
                'align' => ['nullable', 'string', Rule::in(self::BUTTON_ALIGNS)],
                'radius' => ['nullable', 'string', Rule::in(self::BUTTON_RADII)],
            ],
            // A gomb felirata és célja együtt kötelező, vagy mindkettő üres; a leírás és az ikon opcionális.
            'cards' => [
                ...$cardsLayout,
                'cards' => ['required', 'array', 'min:1', 'max:'.self::MAX_CARDS],
                'cards.*.id' => ['required', 'string', 'max:64'],
                'cards.*.title' => ['required', 'string', 'max:100'],
                'cards.*.text' => ['nullable', 'string', 'max:500'],
                'cards.*.icon' => ['nullable', 'string', Rule::in(Icons::names())],
                'cards.*.label' => ['nullable', 'string', 'max:100', "required_with:$card.url"],
                'cards.*.url' => ['nullable', 'string', 'max:2048', 'regex:'.self::URL_PATTERN, "required_with:$card.label"],
            ],
            // Minden rész címe és szövege kötelező; a részek a publikált oldalon alapból zártak.
            'accordion' => [
                'items' => ['required', 'array', 'min:1', 'max:'.self::MAX_ACCORDION_ITEMS],
                'items.*.id' => ['required', 'string', 'max:64'],
                'items.*.title' => ['required', 'string', 'max:150'],
                'items.*.text' => ['required', 'string', 'max:2000'],
            ],
            default => [],
        };
    }
}
