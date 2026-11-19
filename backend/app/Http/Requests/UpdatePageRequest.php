<?php

namespace App\Http\Requests;

use App\Models\Page;
use App\Support\PageContentRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdatePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        Gate::authorize('update', $this->route('page'));

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Page $page */
        $page = $this->route('page');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:63',
                'regex:'.StoreWebsiteRequest::SLUG_PATTERN,
                Rule::unique('pages', 'slug')->where('website_id', $page->website_id)->ignore($page),
            ],
            ...PageContentRules::rules($this->input('content')),
        ];
    }
}
