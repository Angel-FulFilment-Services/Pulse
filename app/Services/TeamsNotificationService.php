<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class TeamsNotificationService
{
    protected string $tenantId;
    protected string $clientId;
    protected string $clientSecret;
    protected string $teamsAppId;

    public function __construct()
    {
        $this->tenantId = config('services.microsoft.tenant_id');
        $this->clientId = config('services.microsoft.client_id');
        $this->clientSecret = config('services.microsoft.client_secret');
        $this->teamsAppId = config('services.microsoft.teams_app_id');
    }

    /**
     * Get access token for Microsoft Graph API
     */
    protected function getAccessToken(): string
    {
        return Cache::remember('microsoft_graph_token', 3500, function () {
            $response = Http::asForm()->post(
                "https://login.microsoftonline.com/{$this->tenantId}/oauth2/v2.0/token",
                [
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'scope' => 'https://graph.microsoft.com/.default',
                    'grant_type' => 'client_credentials',
                ]
            );

            if ($response->failed()) {
                Log::error('Failed to get Microsoft Graph token', $response->json());
                throw new \Exception('Failed to authenticate with Microsoft Graph');
            }

            return $response->json('access_token');
        });
    }

    /**
     * Get Teams user ID from email
     */
    public function getTeamsUserIdByEmail(string $email): ?string
    {
        try {
            $response = Http::withToken($this->getAccessToken())
                ->get("https://graph.microsoft.com/v1.0/users/{$email}");

            if ($response->failed()) {
                Log::warning("Could not find Teams user for email: {$email}", $response->json());
                return null;
            }

            return $response->json('id');
        } catch (\Exception $e) {
            Log::error("Error looking up Teams user: {$email}", ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Send a chat notification to a Teams user
     * 
     * @param string $recipientEmail Email of the recipient
     * @param string $senderName Display name of the sender
     * @param string $message Message content
     * @param int|null $teamId Team ID (for group chats)
     * @param int|null $recipientId Recipient user ID (for DMs)
     */
    public function sendChatNotification(
        string $recipientEmail, 
        string $senderName, 
        string $message, 
        ?int $teamId = null,
        ?int $recipientId = null
    ): bool {
        $teamsUserId = $this->getTeamsUserIdByEmail($recipientEmail);

        if (!$teamsUserId) {
            return false;
        }

        // Truncate message for preview
        $previewMessage = strlen($message) > 100 ? substr($message, 0, 97) . '...' : $message;

        // Build the deep link URL to open the chat in your Teams app
        // Format: https://teams.microsoft.com/l/entity/{appId}/{entityId}?context={context}
        $entityId = $teamId ? "chat-team-{$teamId}" : "chat-dm-{$recipientId}";
        $subEntityId = $teamId ? "team-{$teamId}" : "dm-{$recipientId}";
        
        $context = json_encode([
            'subEntityId' => $subEntityId,
        ]);
        
        $teamsDeepLink = "https://teams.microsoft.com/l/entity/{$this->teamsAppId}/{$entityId}?context=" . urlencode($context);

        try {
            $response = Http::withToken($this->getAccessToken())
                ->post("https://graph.microsoft.com/v1.0/users/{$teamsUserId}/teamwork/sendActivityNotification", [
                    'topic' => [
                        'source' => 'text',
                        'value' => $previewMessage,
                        'webUrl' => $teamsDeepLink,
                    ],
                    'activityType' => 'newMessage',
                    'previewText' => [
                        'content' => "{$senderName} sent you a message"
                    ],
                    'templateParameters' => [
                        ['name' => 'sender', 'value' => $senderName],
                        ['name' => 'message', 'value' => $previewMessage],
                    ],
                ]);

            if ($response->failed()) {
                $error = $response->json();
                $errorCode = $error['error']['code'] ?? 'Unknown';
                
                // Don't log as error if user simply doesn't have the app installed
                if ($errorCode === 'Forbidden') {
                    Log::debug("Teams app not installed for user: {$recipientEmail}");
                } else {
                    Log::error('Failed to send Teams notification', [
                        'user' => $recipientEmail,
                        'error' => $error
                    ]);
                }
                return false;
            }

            Log::info("Teams notification sent to {$recipientEmail}");
            return true;

        } catch (\Exception $e) {
            Log::error('Exception sending Teams notification', [
                'user' => $recipientEmail,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}
