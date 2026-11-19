<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WebsiteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'publish_status' => $this->publish_status?->value,
            'published_at' => $this->published_at,
            'published_url' => $this->published_slug ? '/sites/'.$this->published_slug.'/' : null,
            'publish_error' => $this->publish_error,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
