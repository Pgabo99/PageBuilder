<?php

namespace Database\Factories;

use App\Models\Page;
use App\Models\Website;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Page>
 */
class PageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'website_id' => Website::factory(),
            'title' => fake()->words(2, true),
            'slug' => fake()->unique()->slug(2),
            'position' => fake()->unique()->numberBetween(1, 1_000_000),
            'content' => [],
        ];
    }
}
