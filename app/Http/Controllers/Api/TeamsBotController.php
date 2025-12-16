<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Models\User\User;
use App\Models\Chat\Message;
use App\Models\Chat\Team;
use App\Events\Chat\MessageSent;

class TeamsBotController extends Controller
{
    /**
     * Handle incoming messages from Teams Bot
     */
    public function handle(Request $request)
    {
        $activity = $request->all();
        
        Log::info('Teams Bot Activity Received', ['type' => $activity['type'] ?? 'unknown']);

        $type = $activity['type'] ?? null;

        switch ($type) {
            case 'message':
                return $this->handleMessage($activity);
            
            case 'invoke':
                return $this->handleInvoke($activity);
            
            case 'conversationUpdate':
                return $this->handleConversationUpdate($activity);
            
            default:
                return response()->json(['status' => 'ok']);
        }
    }

    /**
     * Handle direct messages to the bot
     */
    protected function handleMessage(array $activity)
    {
        $text = $activity['text'] ?? '';
        $from = $activity['from'] ?? [];
        
        // Get user email from Azure AD
        $userEmail = $this->getUserEmailFromAzureId($from['aadObjectId'] ?? null);
        $user = $userEmail ? User::where('email', $userEmail)->first() : null;

        if (!$user) {
            return $this->sendReply($activity, "Sorry, I couldn't find your account. Please make sure you're using the same email as your Pulse account.");
        }

        // Show help message
        return $this->sendReply($activity, "👋 Hi {$user->name}! To reply to messages, use the **Quick Reply** button from your notifications, or open Pulse directly.");
    }

    /**
     * Handle compose extension actions (Quick Reply)
     */
    protected function handleInvoke(array $activity)
    {
        $name = $activity['name'] ?? '';
        Log::info('Teams Bot Invoke', ['name' => $name]);

        // Handle the submit action from the reply card
        if ($name === 'composeExtension/submitAction') {
            return $this->handleQuickReplySubmit($activity);
        }

        // Handle fetching the task module (reply form)
        if ($name === 'composeExtension/fetchTask') {
            return $this->handleFetchReplyForm($activity);
        }

        // Handle adaptive card action
        if ($name === 'adaptiveCard/action') {
            return $this->handleAdaptiveCardAction($activity);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Handle quick reply form submission
     */
    protected function handleQuickReplySubmit(array $activity)
    {
        $data = $activity['value']['data'] ?? [];
        $replyMessage = $data['replyMessage'] ?? '';
        $chatType = $data['chatType'] ?? '';
        $chatId = $data['chatId'] ?? null;
        $from = $activity['from'] ?? [];

        // Get user
        $userEmail = $this->getUserEmailFromAzureId($from['aadObjectId'] ?? null);
        $user = $userEmail ? User::where('email', $userEmail)->first() : null;

        if (!$user || !$chatId || !$replyMessage) {
            return response()->json([
                'composeExtension' => [
                    'type' => 'message',
                    'text' => '❌ Failed to send reply. Missing information.'
                ]
            ]);
        }

        try {
            if ($chatType === 'team') {
                $this->sendTeamMessage($user, (int) $chatId, $replyMessage);
            } else {
                $this->sendDirectMessage($user, (int) $chatId, $replyMessage);
            }

            return response()->json([
                'composeExtension' => [
                    'type' => 'message',
                    'text' => '✅ Reply sent!'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Quick reply failed', ['error' => $e->getMessage()]);
            return response()->json([
                'composeExtension' => [
                    'type' => 'message',
                    'text' => '❌ Failed to send reply. Please try again.'
                ]
            ]);
        }
    }

    /**
     * Handle adaptive card button action (inline reply)
     */
    protected function handleAdaptiveCardAction(array $activity)
    {
        $data = $activity['value']['action']['data'] ?? [];
        $replyMessage = $data['replyMessage'] ?? '';
        $chatType = $data['chatType'] ?? '';
        $chatId = $data['chatId'] ?? null;
        $from = $activity['from'] ?? [];

        $userEmail = $this->getUserEmailFromAzureId($from['aadObjectId'] ?? null);
        $user = $userEmail ? User::where('email', $userEmail)->first() : null;

        if (!$user || !$chatId || !$replyMessage) {
            return response()->json([
                'statusCode' => 200,
                'type' => 'application/vnd.microsoft.activity.message',
                'value' => '❌ Could not send reply.'
            ]);
        }

        try {
            if ($chatType === 'team') {
                $this->sendTeamMessage($user, (int) $chatId, $replyMessage);
            } else {
                $this->sendDirectMessage($user, (int) $chatId, $replyMessage);
            }

            return response()->json([
                'statusCode' => 200,
                'type' => 'application/vnd.microsoft.activity.message',
                'value' => '✅ Reply sent!'
            ]);
        } catch (\Exception $e) {
            Log::error('Adaptive card reply failed', ['error' => $e->getMessage()]);
            return response()->json([
                'statusCode' => 200,
                'type' => 'application/vnd.microsoft.activity.message',
                'value' => '❌ Failed to send reply.'
            ]);
        }
    }

    /**
     * Return the quick reply form
     */
    protected function handleFetchReplyForm(array $activity)
    {
        $data = $activity['value']['data'] ?? [];

        return response()->json([
            'task' => [
                'type' => 'continue',
                'value' => [
                    'title' => 'Quick Reply',
                    'height' => 'medium',
                    'width' => 'medium',
                    'card' => $this->buildReplyCard($data)
                ]
            ]
        ]);
    }

    /**
     * Handle conversation updates (bot added/removed)
     */
    protected function handleConversationUpdate(array $activity)
    {
        $membersAdded = $activity['membersAdded'] ?? [];
        
        foreach ($membersAdded as $member) {
            if ($member['id'] === ($activity['recipient']['id'] ?? null)) {
                // Bot was added - send welcome message
                return $this->sendReply($activity, "👋 Hi! I'm the Pulse Chat bot. I'll notify you when you receive new messages and let you reply directly from Teams.");
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Send a message to a team chat
     */
    protected function sendTeamMessage(User $user, int $teamId, string $body): void
    {
        $team = Team::findOrFail($teamId);

        // Verify user is a member
        if (!$team->users()->where('user_id', $user->id)->exists()) {
            throw new \Exception('User is not a member of this team');
        }

        $message = Message::create([
            'team_id' => $teamId,
            'sender_id' => $user->id,
            'recipient_id' => null,
            'body' => $body,
            'type' => 'text',
            'sent_at' => now(),
        ]);

        // Broadcast the message
        event(new MessageSent($message));
    }

    /**
     * Send a direct message
     */
    protected function sendDirectMessage(User $sender, int $recipientId, string $body): void
    {
        $recipient = User::findOrFail($recipientId);

        $message = Message::create([
            'team_id' => null,
            'sender_id' => $sender->id,
            'recipient_id' => $recipientId,
            'body' => $body,
            'type' => 'text',
            'sent_at' => now(),
        ]);

        // Broadcast the message
        event(new MessageSent($message));
    }

    /**
     * Get user email from Azure AD Object ID
     */
    protected function getUserEmailFromAzureId(?string $azureObjectId): ?string
    {
        if (!$azureObjectId) {
            return null;
        }

        try {
            $token = $this->getGraphToken();
            $response = Http::withToken($token)
                ->get("https://graph.microsoft.com/v1.0/users/{$azureObjectId}");

            if ($response->successful()) {
                return $response->json('mail') ?? $response->json('userPrincipalName');
            }
        } catch (\Exception $e) {
            Log::error('Failed to get user email from Azure', ['error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Get Microsoft Graph API token
     */
    protected function getGraphToken(): string
    {
        return cache()->remember('teams_graph_token', 3500, function () {
            $response = Http::asForm()->post(
                'https://login.microsoftonline.com/' . config('services.microsoft.tenant_id') . '/oauth2/v2.0/token',
                [
                    'grant_type' => 'client_credentials',
                    'client_id' => config('services.microsoft.client_id'),
                    'client_secret' => config('services.microsoft.client_secret'),
                    'scope' => 'https://graph.microsoft.com/.default',
                ]
            );

            return $response->json('access_token');
        });
    }

    /**
     * Send a reply back to Teams
     */
    protected function sendReply(array $activity, string $text)
    {
        $serviceUrl = rtrim($activity['serviceUrl'] ?? 'https://smba.trafficmanager.net/uk/', '/');
        $conversationId = $activity['conversation']['id'] ?? null;

        if (!$conversationId) {
            return response()->json(['status' => 'ok']);
        }

        try {
            $token = $this->getBotToken();
            Http::withToken($token)
                ->post("{$serviceUrl}/v3/conversations/{$conversationId}/activities", [
                    'type' => 'message',
                    'text' => $text,
                ]);
        } catch (\Exception $e) {
            Log::error('Failed to send Teams reply', ['error' => $e->getMessage()]);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Build adaptive card for reply form
     */
    protected function buildReplyCard(array $data): array
    {
        $chatType = $data['chatType'] ?? 'dm';
        $chatId = $data['chatId'] ?? '';
        $senderName = $data['senderName'] ?? 'Someone';

        return [
            'contentType' => 'application/vnd.microsoft.card.adaptive',
            'content' => [
                '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
                'type' => 'AdaptiveCard',
                'version' => '1.4',
                'body' => [
                    [
                        'type' => 'TextBlock',
                        'text' => "Reply to {$senderName}",
                        'weight' => 'bolder',
                        'size' => 'medium'
                    ],
                    [
                        'type' => 'Input.Text',
                        'id' => 'replyMessage',
                        'placeholder' => 'Type your reply...',
                        'isMultiline' => true,
                        'maxLength' => 2000
                    ]
                ],
                'actions' => [
                    [
                        'type' => 'Action.Submit',
                        'title' => 'Send Reply',
                        'data' => [
                            'chatType' => $chatType,
                            'chatId' => $chatId
                        ]
                    ]
                ]
            ]
        ];
    }

    /**
     * Get bot access token for Bot Framework
     */
    protected function getBotToken(): string
    {
        return cache()->remember('teams_bot_token', 3500, function () {
            $response = Http::asForm()->post(
                'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
                [
                    'grant_type' => 'client_credentials',
                    'client_id' => config('services.microsoft.client_id'),
                    'client_secret' => config('services.microsoft.client_secret'),
                    'scope' => 'https://api.botframework.com/.default',
                ]
            );

            return $response->json('access_token');
        });
    }
}
