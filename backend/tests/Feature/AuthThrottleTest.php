<?php

// A regisztráció és a bejelentkezés közös, IP-nkénti percenkénti korlátja: alapérték 5; csak érvényes,
// pozitív egész érték írhatja felül (az E2E-környezet emeli), minden más az alapértékre esik vissza.

function exhaust(int $allowed): void
{
    foreach (range(1, $allowed) as $i) {
        test()->postJson('/api/v1/register', [])->assertUnprocessable();
    }
}

it('a beállított korlátig enged, utána 429-et ad', function () {
    config(['auth.throttle_per_minute' => 7]);

    exhaust(7);

    $this->postJson('/api/v1/register', [])->assertTooManyRequests();
});

it('a regisztráció és a bejelentkezés közös korlátot használ', function () {
    exhaust(5);

    $this->postJson('/api/v1/login', ['email' => 'x@example.com', 'password' => 'rossz'])
        ->assertTooManyRequests();
});

it('érvénytelen beállításnál az alapérték (5) marad, a korlát nem kapcsolódik ki', function (mixed $invalid) {
    config(['auth.throttle_per_minute' => $invalid]);

    exhaust(5);

    $this->postJson('/api/v1/register', [])->assertTooManyRequests();
})->with([
    'nulla' => 0,
    'negatív' => -3,
    'szöveg' => 'sok',
    'üres' => '',
    'tört' => '2.5',
    'nem beállított' => null,
]);
