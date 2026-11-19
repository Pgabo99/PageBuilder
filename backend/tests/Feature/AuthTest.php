<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// A Sanctum csak az ismert SPA-originről érkező kérésekre indít sessiont.
beforeEach(fn () => $this->withHeader('Origin', 'http://localhost'));

describe('register', function () {
    it('létrehozza és bejelentkezteti a felhasználót', function () {
        $this->postJson('/api/v1/register', [
            'name' => 'Teszt Elek',
            'email' => 'elek@example.com',
            'password' => 'jelszo-12345',
            'password_confirmation' => 'jelszo-12345',
        ])
            ->assertCreated()
            ->assertJsonPath('data.email', 'elek@example.com')
            ->assertJsonMissingPath('data.password');

        $this->assertAuthenticatedAs(User::firstWhere('email', 'elek@example.com'));
    });

    it('foglalt e-mail címre 422-t ad', function () {
        User::factory()->create(['email' => 'elek@example.com']);

        $this->postJson('/api/v1/register', [
            'name' => 'Teszt Elek',
            'email' => 'elek@example.com',
            'password' => 'jelszo-12345',
            'password_confirmation' => 'jelszo-12345',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    });

    it('túl sok kérésre 429-et ad', function () {
        foreach (range(1, 5) as $i) {
            $this->postJson('/api/v1/register', []);
        }

        $this->postJson('/api/v1/register', [])->assertTooManyRequests();
    });
});

describe('login', function () {
    it('helyes adatokkal bejelentkeztet és újragenerálja a sessiont', function () {
        $user = User::factory()->create(['password' => 'jelszo-12345']);
        $this->withSession(['probe' => true]);
        $oldSessionId = session()->getId();

        $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'jelszo-12345'])
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $this->assertAuthenticatedAs($user);
        expect(session()->getId())->not->toBe($oldSessionId);
    });

    it('hibás jelszóra 422-t ad', function () {
        $user = User::factory()->create(['password' => 'jelszo-12345']);

        $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'rossz'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertGuest();
    });

    it('túl sok kérésre 429-et ad', function () {
        foreach (range(1, 5) as $i) {
            $this->postJson('/api/v1/login', ['email' => 'x@example.com', 'password' => 'rossz']);
        }

        $this->postJson('/api/v1/login', ['email' => 'x@example.com', 'password' => 'rossz'])
            ->assertTooManyRequests();
    });
});

describe('logout', function () {
    it('kijelentkeztet, érvényteleníti a sessiont és új CSRF tokent ad', function () {
        $this->actingAs(User::factory()->create());
        $oldToken = session()->token();

        $this->postJson('/api/v1/logout')->assertNoContent();

        $this->assertGuest('web');
        expect(session()->token())->not->toBe($oldToken);
    });
});

describe('user', function () {
    it('a bejelentkezett felhasználót adja vissza', function () {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/v1/user')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);
    });

    it('bejelentkezés nélkül 401-et ad', function () {
        $this->getJson('/api/v1/user')->assertUnauthorized();
    });
});
