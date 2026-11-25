<?php

namespace App\Support;

use Closure;
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

    /** Az elválasztó vonal megjelenése; az üres érték a vékony, folytonos, a keretszínű vonal. */
    public const DIVIDER_OPTIONS = [
        'thickness' => ['thin', 'medium', 'thick'],
        'style' => ['solid', 'dashed', 'dotted'],
        'color' => ['border', 'text', 'accent'],
    ];

    /** A térköz magassága rem-ben (egész szám). */
    public const SPACER_MIN_HEIGHT = 1;

    public const SPACER_MAX_HEIGHT = 20;

    public const SPACER_DEFAULT_HEIGHT = 2;

    /** Az értesítődoboz típusai. */
    public const ALERT_VARIANTS = ['info', 'success', 'warning', 'error'];

    public const MAX_STATS = 6;

    /** A szöveg formátuma: az üres érték a sima szöveg (a régi komponensek), a `markdown` a formázott szöveg. */
    public const TEXT_FORMATS = ['markdown'];

    public const MAX_SOCIAL = 10;

    public const MAX_FOOTER_LINKS = 8;

    /** A lábléc telefonszáma: számjegyek, +, szóköz, zárójel, kötőjel és pont. */
    public const PHONE_PATTERN = '~^[0-9+()\-\s.]*[0-9][0-9+()\-\s.]*$~';

    private const TYPES = ['heading', 'text', 'button', 'cards', 'accordion', 'divider', 'spacer', 'alert', 'quote', 'stats', 'social', 'footer'];

    /**
     * @return array<string, mixed>
     */
    public static function rules(mixed $content): array
    {
        $rules = [
            'content' => ['present', 'array', 'max:'.self::MAX_COMPONENTS, self::singleFooter(...)],
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

    /** Egy oldalon legfeljebb egy lábléc lehet (a lábléc az oldal végén jelenik meg). */
    private static function singleFooter(string $attribute, mixed $value, Closure $fail): void
    {
        $footers = is_array($value)
            ? count(array_filter($value, fn ($component) => is_array($component) && ($component['type'] ?? null) === 'footer'))
            : 0;

        if ($footers > 1) {
            $fail('Egy oldalon legfeljebb egy lábléc lehet.');
        }
    }

    /**
     * Opcionális, előre definiált értékek szabályai (az üres érték az alapmegjelenés); a számokat egészként várja.
     *
     * @param  array<string, list<int|string>>  $options
     * @return array<string, array<int, mixed>>
     */
    private static function optionRules(array $options): array
    {
        return collect($options)
            ->map(fn (array $values) => [
                'nullable',
                is_int($values[0]) ? 'integer' : 'string',
                Rule::in($values),
            ])
            ->all();
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private static function fields(mixed $type, int|string $index): array
    {
        $card = "content.$index.cards.*";
        $cardsLayout = self::optionRules(self::CARDS_OPTIONS);

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
                'format' => ['nullable', 'string', Rule::in(self::TEXT_FORMATS)],
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
            'divider' => self::optionRules(self::DIVIDER_OPTIONS),
            // A forrás linkje csak a forrás szövegével együtt adható meg (a link a forrás szövegén jelenik meg).
            'quote' => [
                'text' => ['required', 'string', 'max:500'],
                'author' => ['nullable', 'string', 'max:100'],
                'source' => ['nullable', 'string', 'max:150', "required_with:content.$index.source_url"],
                'source_url' => ['nullable', 'string', 'max:2048', 'regex:'.self::URL_PATTERN],
            ],
            // Az érték szövegként tárolt (pl. „120+”), így formázható; az előtag és az utótag opcionális.
            'stats' => [
                'items' => ['required', 'array', 'min:1', 'max:'.self::MAX_STATS],
                'items.*.id' => ['required', 'string', 'max:64'],
                'items.*.value' => ['required', 'string', 'max:20'],
                'items.*.label' => ['required', 'string', 'max:60'],
                'items.*.icon' => ['nullable', 'string', Rule::in(Icons::names())],
                'items.*.prefix' => ['nullable', 'string', 'max:10'],
                'items.*.suffix' => ['nullable', 'string', 'max:10'],
            ],
            // A platform a márkaikonok készletéből (`Icons::brandNames()`) választható; a link a meglévő URL-szabályt követi.
            'social' => [
                'items' => ['required', 'array', 'min:1', 'max:'.self::MAX_SOCIAL],
                'items.*.id' => ['required', 'string', 'max:64'],
                'items.*.platform' => ['required', 'string', Rule::in(Icons::brandNames())],
                'items.*.url' => ['required', 'string', 'max:2048', 'regex:'.self::URL_PATTERN],
            ],
            // A lábléc oldalszintű komponens (nincs migráció): a linkek a gombokkal azonos URL-szabályt követik.
            'footer' => [
                'copyright' => ['nullable', 'string', 'max:150'],
                'links' => ['nullable', 'array', 'max:'.self::MAX_FOOTER_LINKS],
                'links.*.id' => ['required', 'string', 'max:64'],
                'links.*.label' => ['required', 'string', 'max:60'],
                'links.*.url' => ['required', 'string', 'max:2048', 'regex:'.self::URL_PATTERN],
                'email' => ['nullable', 'string', 'max:254', 'email'],
                'phone' => ['nullable', 'string', 'max:30', 'regex:'.self::PHONE_PATTERN],
                'address' => ['nullable', 'string', 'max:200'],
            ],
            'alert' => [
                'variant' => ['required', 'string', Rule::in(self::ALERT_VARIANTS)],
                'title' => ['nullable', 'string', 'max:100'],
                'text' => ['required', 'string', 'max:500'],
                'icon' => ['nullable', 'string', Rule::in(Icons::names())],
            ],
            'spacer' => [
                'height' => ['required', 'integer', 'between:'.self::SPACER_MIN_HEIGHT.','.self::SPACER_MAX_HEIGHT],
            ],
            default => [],
        };
    }
}
