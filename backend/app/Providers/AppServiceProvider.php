<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(self::authAttemptsPerMinute())->by($request->ip()));
    }

    /** Csak pozitív egész érték írhatja felül az alapértéket, így egy elírás nem kapcsolja ki a korlátot. */
    private static function authAttemptsPerMinute(): int
    {
        $configured = filter_var(config('auth.throttle_per_minute'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        return $configured === false ? 5 : $configured;
    }
}
