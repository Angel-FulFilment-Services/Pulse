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
    public string $queue = 'pulse';

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 10;

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
        Log::info('SendTeamsNotification: Listener triggered');
        
        $message = $event->message;
        $sender = $message->sender;

        Log::info('SendTeamsNotification: Processing message', [
            'message_id' => $message->id,
            'sender_id' => $sender?->id,
            'team_id' => $message->team_id,
            'recipient_id' => $message->recipient_id,
        ]);

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
            ->with('user')
            ->get();

        foreach ($teamUsers as $teamUser) {
            if ($teamUser->user && $teamUser->user->email) {
                $this->teamsService->sendChatNotification(
                    recipientEmail: $teamUser->user->email,
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
        $recipient = $message->recipient;

        if (!$recipient || !$recipient->email) {
            Log::warning('DM has no recipient', ['message_id' => $message->id]);
            return;
        }

        $this->teamsService->sendChatNotification(
            recipientEmail: $recipient->email,
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
