<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use App\Services\BadgeService;

class RefreshUserBadges implements ShouldQueue
{
    use Queueable;

    public int $userId;
    public int $tries = 3;
    public int $timeout = 300; // 5 minutes

    /**
     * Create a new job instance.
     */
    public function __construct(int $userId)
    {
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(BadgeService $badgeService): void
    {
        try {
            $results = $badgeService->refreshUserBadges($this->userId);
            
            if (!empty($results['awarded'])) {
                Log::info("User {$this->userId} earned badges: " . implode(', ', $results['awarded']));
            }
            
            if (!empty($results['errors'])) {
                Log::warning("Badge refresh had errors for user {$this->userId}", $results['errors']);
            }
        } catch (\Exception $e) {
            Log::error("Failed to refresh badges for user {$this->userId}: " . $e->getMessage(), [
                'exception' => $e,
            ]);
            throw $e;
        }
    }
}
