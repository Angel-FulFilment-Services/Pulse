<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GenericEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;
    protected $notification_url, $notification_greeting, $notification_line_1, $notification_action, $notification_table, $notification_table_view, $notification_footer_line_1, $notification_panel;
    /**
     * Create a new notification_url instance.
     *
     * @param $notification_url
     */
    public function __construct($notification_url, $notification_greeting, $notification_line_1, $notification_table, $notification_action, $notification_table_view, $notification_footer_line_1 = '', $notification_panel = '')
    {
        $this->notification_url             = $notification_url;
        $this->notification_greeting        = $notification_greeting;
        $this->notification_line_1          = $notification_line_1;
        $this->notification_table           = $notification_table;
        $this->notification_action          = $notification_action;
        $this->notification_table_view      = $notification_table_view;
        $this->notification_footer_line_1   = $notification_footer_line_1;
        $this->notification_panel           = $notification_panel;
    }
    /**
     * Get the notification_url's delivery channels.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }
    /**
     * Get the mail representation of the notification_url.
     *
     * @param mixed $notifiable
     * @return MailMessage
     */
    public function toMail($notifiable)
    {
        $table = $this->notification_table;
        $table_view = $this->notification_table_view;
        $panel_text = $this->notification_panel;

        return (new MailMessage)
            ->subject($this->notification_greeting)
            ->greeting($this->notification_greeting)
            ->line($this->notification_line_1)
            ->action($this->notification_action, $this->notification_url)
            ->lineif($this->notification_footer_line_1, $this->notification_footer_line_1)
            ->markdown('vendor.notifications.email-generic', ['table' => $table, 'table_view' => $table_view, 'panel_text' => $panel_text]);
    }       
    /**
     * Get the array representation of the notification.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            //
        ];
    }
}
