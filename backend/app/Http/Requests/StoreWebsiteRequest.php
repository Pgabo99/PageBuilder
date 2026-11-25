<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWebsiteRequest extends FormRequest
{
    /** Kisbetű, szám és egyszeres kötőjel; nem kezdődhet és nem végződhet kötőjellel. */
    public const SLUG_PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    /** Hat számjegyű hexadecimális szín (#RRGGBB). */
    public const COLOR_PATTERN = '/^#[0-9a-fA-F]{6}$/';

    public const PAGE_THEMES = ['light', 'dark', 'blue', 'purple'];

    /** Az egyedi színpaletta kulcsai (a kiemelőszín az `accent_color` mezőben van). */
    public const PALETTE_COLORS = ['background', 'text', 'primary'];

    /**
     * A megjelenés mezői (kiemelőszín, téma, egyedi színek): a webhely létrehozásánál és módosításánál közös.
     *
     * @return array<string, mixed>
     */
    public static function appearanceRules(): array
    {
        $palette = [];
        foreach (self::PALETTE_COLORS as $color) {
            $palette["palette.$color"] = ['nullable', 'string', 'regex:'.self::COLOR_PATTERN];
        }

        return [
            'accent_color' => ['nullable', 'string', 'regex:'.self::COLOR_PATTERN],
            'page_theme' => ['nullable', 'string', Rule::in(self::PAGE_THEMES)],
            'palette' => ['nullable', 'array'],
            ...$palette,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:63', 'regex:'.self::SLUG_PATTERN, 'unique:websites,slug'],
            ...self::appearanceRules(),
        ];
    }
}
