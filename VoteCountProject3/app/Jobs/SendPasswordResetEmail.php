<?php

namespace App\Jobs;

use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendPasswordResetEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public User $user;

    public string $otpCode;

    public function __construct(User $user, string $otpCode)
    {
        $this->user = $user;
        $this->otpCode = $otpCode;
    }

    public function handle(): void
    {
        Mail::to($this->user->email)
            ->send(new PasswordResetMail($this->user, $this->otpCode));
    }
}
