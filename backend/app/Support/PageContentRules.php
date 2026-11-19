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

    private const TYPES = ['heading', 'text', 'button'];

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

            foreach (self::fields($type) as $field => $fieldRules) {
                $rules["content.$index.$field"] = $fieldRules;
            }
        }

        return $rules;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private static function fields(mixed $type): array
    {
        return match ($type) {
            'heading' => [
                'text' => ['required', 'string', 'max:255'],
                'level' => ['required', 'integer', 'between:1,3'],
            ],
            'text' => [
                'text' => ['required', 'string', 'max:5000'],
            ],
            'button' => [
                'label' => ['required', 'string', 'max:100'],
                'url' => ['required', 'string', 'max:2048', 'regex:'.self::URL_PATTERN],
            ],
            default => [],
        };
    }
}
