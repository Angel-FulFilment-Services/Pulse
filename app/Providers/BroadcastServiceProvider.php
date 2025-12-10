<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Don't register routes here - we do it in web.php with proper middleware
        // Broadcast::routes();

        require base_path('routes/channels.php');
    }
}
