<?php

namespace App\Jobs;

use App\Mail\EmailVerificationMail;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendVerificationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public User $user;

    public string $token;
    public string $otpCode;

    public function __construct(User $user, string $token, string $otpCode)
    {
        $this->user = $user;
        $this->token = $token;
        $this->otpCode = $otpCode;
    }


    public function handle(): void
    {
        $verificationUrl = config('app.frontend_url')
            . '/auth/verify-email?token=' . $this->token
            . '&email=' . urlencode($this->user->email);

        Mail::to($this->user->email)
            ->send(new EmailVerificationMail($this->user, $verificationUrl, $this->otpCode));
    }
}
