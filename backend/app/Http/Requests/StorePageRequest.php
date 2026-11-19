<?php

namespace App\Http\Requests;

use App\Models\Website;
use App\Support\PageContentRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StorePageRequest extends FormRequest
{
    // Idegen webhelyre 404 még a validáció előtt (a Policy denyAsNotFound-ot ad).
    public function authorize(): bool
    {
        Gate::authorize('update', $this->route('website'));

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Website $website */
        $website = $this->route('website');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:63',
                'regex:'.StoreWebsiteRequest::SLUG_PATTERN,
                Rule::unique('pages', 'slug')->where('website_id', $website->id),
            ],
            ...PageContentRules::rules($this->input('content')),
        ];
    }
}
