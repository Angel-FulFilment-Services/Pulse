<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FireRollCallNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $data;

    /**
     * Create a new notification instance.
     */
    public function __construct($data)
    {
        $this->data = $data;
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
        return (new MailMessage)
            ->subject('FIRE EMERGENCY - Immediate Action Required')
            ->greeting('Fire Emergency Alert')
            ->line('A fire emergency has been reported.')
            ->line('For your safety and to assist emergency services, we need to confirm everyone\'s status immediately.')
            ->action('Confirm Your Safety Status', $this->data['roll_call_url'])
            ->line('Please click the button above to access the roll call form.')
            ->line('**This link is valid for 1 hour.**')
            ->line('If you are unable to access the link, scan the QR code on the backside of the fire assembly point sign.')
            ->line('')
            ->line('**Alert Triggered By:** ' . $this->data['triggered_by'])
            ->line('**Time:** ' . $this->data['triggered_at']);
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable)
    {
        return [
            'triggered_by' => $this->data['triggered_by'],
            'triggered_at' => $this->data['triggered_at'],
        ];
    }
}
