<?php

namespace App\Models;

use App\Enums\PublishStatus;
use Database\Factories\WebsiteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// A user_id szándékosan nem fillable: mindig a bejelentkezett felhasználóból kerül beállításra.
#[Fillable(['name', 'slug', 'accent_color', 'page_theme', 'palette'])]
class Website extends Model
{
    /** @use HasFactory<WebsiteFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'publish_status' => PublishStatus::class,
            'published_at' => 'datetime',
            'palette' => 'array',
        ];
    }

    /** Folyamatban lévő publikálás; a régi (pl. leállt worker miatt beragadt) állapot nem számít. */
    public function isPublishing(): bool
    {
        return in_array($this->publish_status, [PublishStatus::Queued, PublishStatus::Running], true)
            && $this->updated_at?->gt(now()->subMinutes(config('publishing.stale_after_minutes'))) === true;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Page, $this>
     */
    public function pages(): HasMany
    {
        return $this->hasMany(Page::class)->orderBy('position');
    }
}
