<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\Elector;
use App\Notifications\OtpCodeNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Notification;

class SendOtpCode implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public User|Elector $recipient;
    public string $otp;
    public string $channel;

    public function __construct($recipient, string $otp, string $channel)
    {
        $this->recipient = $recipient;
        $this->otp = $otp;
        $this->channel = $channel;
    }

    public function handle(): void
    {
        Notification::send($this->recipient, new OtpCodeNotification($this->otp, $this->channel));
    }
}

