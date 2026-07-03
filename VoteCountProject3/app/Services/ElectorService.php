<?php

namespace App\Services;

use App\Models\Election;
use App\Models\Elector;
use App\Notifications\VoterCodeNotification;
use App\Models\Notification as NotificationModel;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class ElectorService
{
    public function create(Election $election, array $data, ?int $userId = null): Elector
    {

        $elector = Elector::create([
            'uuid' => Str::uuid()->toString(),
            'election_id' => $election->id,
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'status' => 'active',
            'verification_status' => 'pending',
        ]);

        if ($election->election_mode === 'private' && $election->voter_code && $elector->email) {
            Notification::route('mail', $elector->email)->notify(new VoterCodeNotification($election, $elector));
            if ($userId) {
                NotificationModel::create([
                    'user_id' => $userId,
                    'type'    => 'voter_code_sent',
                    'title'   => 'Code électeur envoyé',
                    'message' => "Code d'accès envoyé à {$elector->full_name} ({$elector->email}) pour « {$election->title} ».",
                    'data'    => [
                        'election_uuid' => $election->uuid,
                        'elector_uuid'  => $elector->uuid,
                    ],
                ]);
            }
        }

        return $elector;
    }

    public function update(Elector $elector, array $data): Elector
    {
        $elector->update($data);

        return $elector->fresh();
    }

    public function verify(Elector $elector): void
    {
        $elector->verify();
    }

    public function block(Elector $elector): void
    {
        $elector->block();
    }
}
