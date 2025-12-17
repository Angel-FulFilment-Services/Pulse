<?php

namespace App\Listeners\Chat;

use App\Events\Chat\MessageSent;
use App\Services\TeamsNotificationService;
use App\Models\Chat\TeamUser;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendTeamsNotification implements ShouldQueue
{
    /**
     * The name of the queue the job should be sent to.
     */
    public $queue = 'pulse';

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public $backoff = 10;

    protected TeamsNotificationService $teamsService;

    public function __construct(TeamsNotificationService $teamsService)
    {
        $this->teamsService = $teamsService;
    }

    /**
     * Handle the event.
     */
    public function handle(MessageSent $event): void
    {
        $message = $event->message;
        $sender = $message->sender;

        if (!$sender) {
            Log::warning('MessageSent event has no sender', ['message_id' => $message->id]);
            return;
        }

        // Determine recipients based on message type (DM vs Team)
        if ($message->team_id) {
            // Team message - notify all team members except sender
            $this->notifyTeamMembers($message, $sender);
        } else {
            // Direct message - notify recipient
            $this->notifyDirectMessageRecipient($message, $sender);
        }
    }

    /**
     * Notify all team members except the sender
     */
    protected function notifyTeamMembers($message, $sender): void
    {
        $teamUsers = TeamUser::where('team_id', $message->team_id)
            ->where('user_id', '!=', $sender->id)
            ->get();

        // Get all user IDs and fetch users from wings_config database
        $userIds = $teamUsers->pluck('user_id')->toArray();
        $users = \App\Models\User\User::whereIn('id', $userIds)->get()->keyBy('id');

        foreach ($teamUsers as $teamUser) {
            $user = $users->get($teamUser->user_id);
            
            Log::info('Teams notification: fetched user for team message', [
                'user_id' => $teamUser->user_id,
                'user_found' => $user ? true : false,
                'email' => $user?->email,
                'ad_email' => $user?->ad_email,
                'all_attributes' => $user?->getAttributes(),
            ]);
            
            if ($user && $user->email) {
                // Use ad_email if set, otherwise fall back to regular email
                $recipientEmail = $user->ad_email ?: $user->email;
                
                Log::info('Teams notification: sending to', ['recipientEmail' => $recipientEmail]);
                
                $this->teamsService->sendChatNotification(
                    recipientEmail: $recipientEmail,
                    senderName: $sender->name ?? $sender->email,
                    message: $this->getMessagePreview($message),
                    teamId: $message->team_id
                );
            }
        }
    }

    /**
     * Notify the recipient of a direct message
     */
    protected function notifyDirectMessageRecipient($message, $sender): void
    {
        // Fetch recipient directly from wings_config database to get ad_email
        $recipient = \App\Models\User\User::find($message->recipient_id);
        
        Log::info('Teams notification: fetched user for DM', [
            'recipient_id' => $message->recipient_id,
            'recipient_found' => $recipient ? true : false,
            'email' => $recipient?->email,
            'ad_email' => $recipient?->ad_email,
            'all_attributes' => $recipient?->getAttributes(),
        ]);

        if (!$recipient || !$recipient->email) {
            Log::warning('DM has no recipient', ['message_id' => $message->id]);
            return;
        }

        // Use ad_email if set, otherwise fall back to regular email
        $recipientEmail = $recipient->ad_email ?: $recipient->email;
        
        Log::info('Teams notification: sending DM to', ['recipientEmail' => $recipientEmail]);

        $this->teamsService->sendChatNotification(
            recipientEmail: $recipientEmail,
            senderName: $sender->name ?? $sender->email,
            message: $this->getMessagePreview($message),
            recipientId: $sender->id // Pass sender ID so the recipient can click to open the DM
        );
    }

    /**
     * Get a preview of the message content
     */
    protected function getMessagePreview($message): string
    {
        $body = $message->body ?? '';

        // Handle attachments
        if (empty($body) && $message->attachments->count() > 0) {
            $count = $message->attachments->count();
            return $count === 1 ? '📎 Sent an attachment' : "📎 Sent {$count} attachments";
        }

        // Strip HTML tags if present
        $body = strip_tags($body);

        return $body ?: 'Sent a message';
    }
}
