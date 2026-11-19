<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Website;
use Illuminate\Auth\Access\Response;

class WebsitePolicy
{
    public function view(User $user, Website $website): Response
    {
        return $this->owns($user, $website);
    }

    public function update(User $user, Website $website): Response
    {
        return $this->owns($user, $website);
    }

    public function delete(User $user, Website $website): Response
    {
        return $this->owns($user, $website);
    }

    // Idegen webhelyre 404: a létezése sem derül ki.
    private function owns(User $user, Website $website): Response
    {
        return $user->id === $website->user_id ? Response::allow() : Response::denyAsNotFound();
    }
}
