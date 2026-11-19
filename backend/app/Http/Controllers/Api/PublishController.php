<?php

namespace App\Http\Controllers\Api;

use App\Enums\PublishStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\WebsiteResource;
use App\Jobs\PublishWebsite;
use App\Models\Website;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class PublishController extends Controller
{
    public function store(Website $website): JsonResponse
    {
        Gate::authorize('update', $website);

        if ($website->isPublishing()) {
            return response()->json(['message' => 'A publikálás már folyamatban van.'], 409);
        }

        if (! $website->pages()->exists()) {
            return response()->json([
                'message' => 'A webhelynek nincs oldala.',
                'errors' => ['pages' => ['Publikálás előtt hozz létre legalább egy oldalt.']],
            ], 422);
        }

        $website->forceFill(['publish_status' => PublishStatus::Queued, 'publish_error' => null])->save();
        PublishWebsite::dispatch($website->id);

        return (new WebsiteResource($website))->response()->setStatusCode(202);
    }
}
