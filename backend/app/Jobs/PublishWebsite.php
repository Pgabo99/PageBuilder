<?php

namespace App\Jobs;

use App\Enums\PublishStatus;
use App\Models\Website;
use App\Services\SitePublisher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class PublishWebsite implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    // Azonosítót kapunk, nem modellt: a webhely állapota a futásig változhat.
    public function __construct(public readonly int $websiteId) {}

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [5, 30];
    }

    // Idempotens: ismételt futtatás ugyanazt a kimenetet adja.
    public function handle(SitePublisher $publisher): void
    {
        $website = Website::find($this->websiteId);

        if ($website === null) {
            return;
        }

        $website->forceFill(['publish_status' => PublishStatus::Running])->save();

        $publisher->publish($website);

        $previousSlug = $website->published_slug;
        if ($previousSlug !== null && $previousSlug !== $website->slug) {
            $publisher->remove($previousSlug);
        }

        $website->forceFill([
            'publish_status' => PublishStatus::Succeeded,
            'published_at' => now(),
            'published_slug' => $website->slug,
            'publish_error' => null,
        ])->save();
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Website publishing failed', ['website_id' => $this->websiteId, 'exception' => $exception]);

        // A felhasználónak általános üzenet: belső részlet nem szivárog ki.
        Website::whereKey($this->websiteId)->update([
            'publish_status' => PublishStatus::Failed,
            'publish_error' => 'A publikálás sikertelen, próbáld újra később.',
        ]);
    }
}
