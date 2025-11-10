<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Models\User\User;
use App\Jobs\RefreshUserBadges;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // $schedule->command('inspire')->hourly();
        $schedule->command('command:BuildAbsenceEventsCommand')->dailyAt('6:00');
        
        // Refresh badges for active users every 15 minutes
        $schedule->call(function () {
            $activeUsers = User::where('last_active_at', '>', now()->subDay())
                ->pluck('id');
                
            foreach ($activeUsers as $userId) {
                RefreshUserBadges::dispatch($userId);
            }
        })->everyFifteenMinutes()->name('refresh-user-badges');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
