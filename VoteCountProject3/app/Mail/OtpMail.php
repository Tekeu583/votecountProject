<?php

namespace App\Mail;

use App\Models\Elector;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public Elector $elector;

    public function __construct(string $otp, Elector $elector)
    {
        $this->otp = $otp;
        $this->elector = $elector;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre code OTP',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
            with: [
                'otp' => $this->otp,
                'name' => $this->elector->full_name,
            ]
        );
    }
}
