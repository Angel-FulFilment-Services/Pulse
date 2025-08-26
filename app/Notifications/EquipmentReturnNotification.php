<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Storage;

class EquipmentReturnNotification extends Notification
{
    use Queueable;

    protected $returnData;
    protected $kitData;
    protected $returnedToUser;
    protected $processedByUser;
    protected $returnItems;
    protected $attachments;

    /**
     * Create a new notification instance.
     */
    public function __construct($returnData, $kitData, $returnedToUser, $processedByUser, $returnItems, $attachments = [])
    {
        $this->returnData = $returnData;
        $this->kitData = $kitData;
        $this->returnedToUser = $returnedToUser;
        $this->processedByUser = $processedByUser;
        $this->returnItems = $returnItems;
        $this->attachments = $attachments;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable)
    {
        // Check if there are any problematic items (not functioning)
        $hasProblematicItems = collect($this->returnItems)->contains(function ($item) {
            return in_array($item['status'], ['faulty', 'damaged', 'not_returned']);
        });

        $mailMessage = (new MailMessage)
            ->subject('Equipment Return Processed - Kit: ' . $this->kitData->alias)
            ->greeting('Equipment Return Processed')
            ->line('An equipment return has been processed and requires your attention.')
            ->markdown('vendor.notifications.equipment-return', [
                'returnData' => $this->returnData,
                'kitData' => $this->kitData,
                'returnedToUser' => $this->returnedToUser,
                'processedByUser' => $this->processedByUser,
                'returnItems' => $this->returnItems,
                'attachments' => $this->attachments
            ]);

        // Set high importance if there are problematic items
        if ($hasProblematicItems) {
            $mailMessage->priority(1); // High priority
        }

        // Add attachments if they exist
        foreach ($this->attachments as $attachment) {
            if (Storage::disk('r2')->exists($attachment['path'])) {
                $fileContents = Storage::disk('r2')->get($attachment['path']);
                $mailMessage->attachData($fileContents, $attachment['original_name']);
            }
        }

        return $mailMessage;
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable)
    {
        return [
            'kit_id' => $this->kitData->id,
            'kit_alias' => $this->kitData->alias,
            'return_date' => $this->returnData->datetime,
        ];
    }
}
