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

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:63', 'regex:'.self::SLUG_PATTERN, 'unique:websites,slug'],
            'accent_color' => ['nullable', 'string', 'regex:'.self::COLOR_PATTERN],
            'page_theme' => ['nullable', 'string', Rule::in(self::PAGE_THEMES)],
        ];
    }
}
