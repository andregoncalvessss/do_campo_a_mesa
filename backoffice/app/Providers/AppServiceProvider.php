<?php

namespace App\Providers;

use App\Models\Review;
use App\Models\User;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Paginator::useBootstrapFive();

        // Contadores do menu lateral (pedidos por validar e avaliações por moderar)
        View::composer('layouts.app', function ($view) {
            if (Auth::check()) {
                $view->with('menuPorValidar', User::porValidar()->count())
                    ->with('menuPorModerar', Review::porModerar()->count());
            }
        });
    }
}
