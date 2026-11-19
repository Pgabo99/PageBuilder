<?php

namespace App\Policies;

use App\Models\Page;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PagePolicy
{
    public function view(User $user, Page $page): Response
    {
        return $this->owns($user, $page);
    }

    public function update(User $user, Page $page): Response
    {
        return $this->owns($user, $page);
    }

    public function delete(User $user, Page $page): Response
    {
        return $this->owns($user, $page);
    }

    // Az oldal a webhelyén keresztül tartozik a felhasználóhoz; idegenre 404.
    private function owns(User $user, Page $page): Response
    {
        return $user->id === $page->website->user_id ? Response::allow() : Response::denyAsNotFound();
    }
}
