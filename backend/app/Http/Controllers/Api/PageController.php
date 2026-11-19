<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePageRequest;
use App\Http\Requests\UpdatePageRequest;
use App\Http\Resources\PageResource;
use App\Models\Page;
use App\Models\Website;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class PageController extends Controller
{
    public function index(Website $website): AnonymousResourceCollection
    {
        Gate::authorize('view', $website);

        return PageResource::collection($website->pages);
    }

    public function store(StorePageRequest $request, Website $website): JsonResponse
    {
        $page = new Page($request->validated());
        $page->website_id = $website->id;
        $page->position = (int) Page::where('website_id', $website->id)->max('position') + 1;
        $page->save();

        return (new PageResource($page))->response()->setStatusCode(201);
    }

    public function show(Page $page): PageResource
    {
        Gate::authorize('view', $page);

        return new PageResource($page);
    }

    public function update(UpdatePageRequest $request, Page $page): PageResource
    {
        $page->update($request->validated());

        return new PageResource($page);
    }

    public function destroy(Page $page): Response
    {
        Gate::authorize('delete', $page);
        $page->delete();

        return response()->noContent();
    }
}
