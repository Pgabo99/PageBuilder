<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWebsiteRequest extends FormRequest
{
    /** Kisbetű, szám és egyszeres kötőjel; nem kezdődhet és nem végződhet kötőjellel. */
    public const SLUG_PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:63', 'regex:'.self::SLUG_PATTERN, 'unique:websites,slug'],
        ];
    }
}
