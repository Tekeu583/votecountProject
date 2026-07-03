<?php

namespace App\DTOs;

use Illuminate\Http\Request;

class VoteDTO extends BaseDTO
{
    public function __construct(
        public array $items,
        public string $idempotencyKey,
        public ?string $voterCode = null,
        public ?string $ipAddress = null,
        public ?string $deviceId = null,
        public ?string $browser = null,
        public ?string $operatingSystem = null,
        public ?string $country = null,
        public ?string $city = null,
        public ?string $voteType = 'standard',
        public ?string $otpCode = null,
        public array $deviceInfo = []
    ) {}

    public static function fromRequest(Request $request, ?string $ip = null): self
    {
        return new self(
            items: $request->input('items', []),
            idempotencyKey: $request->input('idempotency_key'),
            voterCode: $request->input('voter_code'),
            ipAddress: $ip ?? $request->ip(),
            deviceId: $request->header('X-Device-ID'),
            browser: $request->header('X-Browser'),
            operatingSystem: $request->header('X-OS'),
            country: $request->input('country'),
            city: $request->input('city'),
            voteType: $request->input('vote_type', 'standard'),
            otpCode: $request->input('otp_code'),
            deviceInfo: [
                'device' => $request->header('User-Agent'),
                'browser' => $request->header('X-Browser'),
                'os' => $request->header('X-OS'),
                'location' => $request->input('location'),
            ]
        );
    }

    public function toArray(): array
    {
        return [
            'items' => $this->items,
            'idempotency_key' => $this->idempotencyKey,
            'voter_code' => $this->voterCode,
            'ip_address' => $this->ipAddress,
            'device_id' => $this->deviceId,
            'browser' => $this->browser,
            'operating_system' => $this->operatingSystem,
            'country' => $this->country,
            'city' => $this->city,
            'vote_type' => $this->voteType,
            'otp_code' => $this->otpCode,
        ];
    }
}
