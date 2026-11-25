<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWebsiteRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:63',
                'regex:'.StoreWebsiteRequest::SLUG_PATTERN,
                Rule::unique('websites', 'slug')->ignore($this->route('website')),
            ],
            ...StoreWebsiteRequest::appearanceRules(),
        ];
    }
}
