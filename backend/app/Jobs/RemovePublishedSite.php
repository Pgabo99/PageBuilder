<?php

namespace App\Jobs;

use App\Models\Website;
use App\Services\SitePublisher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * A publikált könyvtár törlése. A megosztott kötetet kizárólag a worker írja és törli:
 * a webes kérés (PHP-FPM) más felhasználóként fut, a worker fájljait nem törölhetné.
 */
class RemovePublishedSite implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(public readonly string $slug) {}

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [5, 30];
    }

    // Idempotens: a nem létező könyvtár törlése nem hiba.
    public function handle(SitePublisher $publisher): void
    {
        // Ha közben egy másik webhely ugyanazt a webcímet publikálta, azt nem töröljük.
        if (Website::where('published_slug', $this->slug)->exists()) {
            return;
        }

        $publisher->remove($this->slug);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Removing published site failed', ['slug' => $this->slug, 'exception' => $exception]);
    }
}
