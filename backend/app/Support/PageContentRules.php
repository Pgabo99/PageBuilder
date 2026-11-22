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

        return match ($type) {
            'heading' => [
                'text' => ['required', 'string', 'max:255'],
                'level' => ['required', 'integer', 'between:1,3'],
                'icon' => ['nullable', 'string', Rule::in(Icons::names())],
            ],
            'text' => [
                'text' => ['required', 'string', 'max:5000'],
            ],
            'button' => [
                'label' => ['required', 'string', 'max:100'],
                'url' => ['required', 'string', 'max:2048', 'regex:'.self::URL_PATTERN],
            ],
            // A gomb felirata és célja együtt kötelező, vagy mindkettő üres; a leírás és az ikon opcionális.
            'cards' => [
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
