<?php

namespace App\DTOs;

use Carbon\Carbon;
use Illuminate\Http\Request;

class ElectionDTO extends BaseDTO
{
    public function __construct(
        public string $title,
        public ?string $shortDescription = null,
        public ?string $description = null,
        public ?string $banner = null,
        public string $electionMode = 'public',
        public string $voteType = 'single',
        public string $visibilityType = 'public',
        public string $paymentType = 'free',
        public string $verificationMode = 'none',
        public ?Carbon $startAt = null,
        public ?Carbon $endAt = null,
        public int $maxVotesPerUser = 1,
        public ?int $maxChoices = null,
        public bool $rankingEnabled = false,
        public bool $otpRequired = false,
        public bool $publicResults = true,
        public bool $realTimeResults = false,
        public bool $allowGuestVote = false,
        public string $currency = 'XAF',
        public float $votePrice = 0,
        public ?array $settings = null,

        public bool    $acceptsCandidates    = false,
        public ?Carbon $candidacyStartAt     = null,
        public ?Carbon $candidacyEndAt       = null,
        public int     $maxCandidates        = 0,
        public ?bool  $hasCategories       = false,
        public ?bool $fraudDetectionEnabled = true,
        public ?string $timezone = 'Africa/Douala',

    ) {}

    public static function fromRequest(Request $request, ?string $bannerPath = null): self
    {
        return new self(
            title: $request->input('title'),
            shortDescription: $request->input('short_description'),
            description: $request->input('description'),
            banner: $bannerPath,
            electionMode: $request->input('election_mode', 'public'),
            voteType: $request->input('vote_type', 'single'),
            visibilityType: $request->input('visibility_type', 'public'),
            paymentType: $request->input('payment_type', 'free'),
            verificationMode: $request->input('verification_mode', 'none'),
            startAt: $request->input('start_at') ? Carbon::parse($request->input('start_at')) : null,
            endAt: $request->input('end_at') ? Carbon::parse($request->input('end_at')) : null,
            maxVotesPerUser: $request->input('max_votes_per_user', 1),
            maxChoices: $request->input('max_choices'),
            rankingEnabled: $request->boolean('ranking_enabled', false),
            otpRequired: $request->boolean('otp_required', false),
            publicResults: $request->boolean('public_results', true),
            realTimeResults: $request->boolean('real_time_results', false),
            allowGuestVote: $request->boolean('allow_guest_vote', false),
            fraudDetectionEnabled: $request->boolean('fraud_detection_enabled', true),
            timezone: $request->input('timezone', 'Africa/Douala'),
            currency: $request->input('currency', 'XAF'),
            votePrice: (float) $request->input('vote_price', 0),
            settings: $request->input('settings'),

            // ── Phase de candidature ──────────────────────────────
            acceptsCandidates: $request->boolean('accepts_candidates', false),
            candidacyStartAt: $request->input('candidacy_start_at')
                ? Carbon::parse($request->input('candidacy_start_at'))
                : null,
            candidacyEndAt: $request->input('candidacy_end_at')
                ? Carbon::parse($request->input('candidacy_end_at'))
                : null,
            maxCandidates: (int) $request->input('max_candidates', 0),
            hasCategories: $request->boolean('has_categories', false),
        );
    }
}
