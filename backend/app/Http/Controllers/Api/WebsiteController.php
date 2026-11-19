<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWebsiteRequest;
use App\Http\Requests\UpdateWebsiteRequest;
use App\Http\Resources\WebsiteResource;
use App\Models\Website;
use App\Services\SitePublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class WebsiteController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return WebsiteResource::collection($request->user()->websites()->latest()->get());
    }

    public function store(StoreWebsiteRequest $request): JsonResponse
    {
        $website = $request->user()->websites()->create($request->validated());

        return (new WebsiteResource($website))->response()->setStatusCode(201);
    }

    public function show(Website $website): WebsiteResource
    {
        Gate::authorize('view', $website);

        return new WebsiteResource($website);
    }

    public function update(UpdateWebsiteRequest $request, Website $website): WebsiteResource
    {
        Gate::authorize('update', $website);
        $website->update($request->validated());

        return new WebsiteResource($website);
    }

    public function destroy(Website $website, SitePublisher $publisher): Response
    {
        Gate::authorize('delete', $website);
        $website->delete();

        if ($website->published_slug !== null) {
            $publisher->remove($website->published_slug);
        }

        return response()->noContent();
    }
}
