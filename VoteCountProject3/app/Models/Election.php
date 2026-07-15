<?php

namespace App\Models;

use App\Enums\ElectionStatus;
use App\Enums\VoteType;
use App\Models\Candidate;
use App\Models\CandidateApplication;
use App\Models\Category;
use App\Models\ElectionAnalytics;
use App\Models\ElectionSetting;
use App\Models\Elector;
use App\Models\FraudReport;
use App\Models\JuryCriteria;
use App\Models\JuryScore;
use App\Models\Organization;
use App\Models\PaymentTransaction;
use App\Models\Result;
use App\Models\ResultSnapshot;
use App\Models\SecurityAlert;
use App\Models\User;
use App\Models\Vote;
use App\Models\VoteDraft;
use App\Models\VoterSession;
use App\Traits\HasAudit;
use App\Traits\HasSoftDeletesWithUser;
use App\Traits\HasUuid;
use App\Traits\IsCacheable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Election extends Model
{
    use HasAudit, HasFactory, HasSoftDeletesWithUser, HasUuid, IsCacheable;

    protected $table = 'elections';

    protected $fillable = [
        'uuid',
        'organization_id',
        'created_by',
        'title',
        'slug',
        'short_description',
        'description',
        'banner',
        'thumbnail',
        'election_mode',
        'vote_type',
        'visibility_type',
        'payment_type',
        'verification_mode',
        'result_calculation_method',
        'status',
        'timezone',
        'start_at',
        'end_at',
        'max_votes_per_user',
        'max_choices',
        'ranking_enabled',
        'otp_required',
        'public_results',
        'real_time_results',
        'allow_guest_vote',
        'fraud_detection_enabled',
        'accepts_candidates',
        'candidacy_start_at',
        'candidacy_end_at',
        'max_candidates',
        'has_categories',
        'currency',
        'vote_price',
        'public_weight',
        'jury_weight',
        'total_votes',
        'total_revenue',
        'published_at',
        'closed_at',
        'voter_code',
        'deleted_by',
        'scheduled_permanent_delete_at',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'published_at' => 'datetime',
        'closed_at' => 'datetime',
        'candidacy_start_at' => 'datetime',
        'candidacy_end_at' => 'datetime',
        'accepts_candidates' => 'boolean',
        'max_candidates' => 'integer',
        'has_categories' => 'boolean',
        'ranking_enabled' => 'boolean',
        'otp_required' => 'boolean',
        'public_results' => 'boolean',
        'real_time_results' => 'boolean',
        'allow_guest_vote' => 'boolean',
        'fraud_detection_enabled' => 'boolean',
        'vote_price' => 'decimal:2',
        'public_weight' => 'float',
        'jury_weight' => 'float',
        'total_votes' => 'integer',
        'total_revenue' => 'decimal:2',
        'status' => ElectionStatus::class,
        'vote_type' => VoteType::class,
        'deleted_at' => 'datetime',
        'scheduled_permanent_delete_at' => 'datetime',
    ];

    protected $attributes = [
        'max_votes_per_user' => 1,
        'fraud_detection_enabled' => true,
        'public_results' => true,
        'vote_price' => 0,
        'currency' => 'XAF',
        'status' => ElectionStatus::DRAFT,
        'vote_type' => VoteType::SINGLE,
    ];

    // ========== RELATIONS ==========

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'election_user')
            ->withPivot('role_slug', 'permissions', 'assigned_by', 'joined_at', 'status')
            ->withTimestamps();
    }

    //categories
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }


    public function settings(): HasOne
    {
        return $this->hasOne(ElectionSetting::class);
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }

    public function electors(): HasMany
    {
        return $this->hasMany(Elector::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(Result::class);
    }

    public function resultSnapshots(): HasMany
    {
        return $this->hasMany(ResultSnapshot::class);
    }

    public function juryCriteria(): HasMany
    {
        return $this->hasMany(JuryCriteria::class);
    }

    public function juryScores(): HasMany
    {
        return $this->hasMany(JuryScore::class);
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function securityAlerts(): HasMany
    {
        return $this->hasMany(SecurityAlert::class);
    }

    public function fraudReports(): HasMany
    {
        return $this->hasMany(FraudReport::class);
    }

    public function candidateApplications(): HasMany
    {
        return $this->hasMany(CandidateApplication::class);
    }

    public function analytics(): HasOne
    {
        return $this->hasOne(ElectionAnalytics::class);
    }

    public function voterSessions(): HasMany
    {
        return $this->hasMany(VoterSession::class);
    }

    public function voteDrafts(): HasMany
    {
        return $this->hasMany(VoteDraft::class);
    }

    /**
     * Récupérer les finalistes de l'élection
     */
    public function getFinalists()
    {
        return $this->candidates()
            ->where('is_finalist', true)
            ->orderBy('finalist_rank')
            ->get();
    }

    /**
     * Récupérer le gagnant (le finaliste avec le rang 1)
     */
    public function getWinner()
    {
        return $this->candidates()
            ->where('is_finalist', true)
            ->where('finalist_rank', 1)
            ->first();
    }

    /**
     * Compter le nombre de finalistes
     */
    public function getFinalistsCount(): int
    {
        return $this->candidates()->where('is_finalist', true)->count();
    }

    /**
     * Vérifier si l'élection a des finalistes
     */
    public function hasFinalists(): bool
    {
        return $this->getFinalistsCount() > 0;
    }

    /**
     * Obtenir le prochain rang disponible pour les finalistes
     */
    public function getNextFinalistRank(): int
    {
        return $this->candidates()
            ->where('is_finalist', true)
            ->max('finalist_rank') + 1;
    }

    /**
     * Élire le gagnant (attribuer le rang 1)
     */
    public function electWinner(Candidate $candidate): void
    {
        // Vérifier que le candidat est bien un finaliste
        if (!$candidate->is_finalist) {
            throw new \Exception('Ce candidat n\'est pas finaliste');
        }

        // Réinitialiser les rangs de tous les finalistes
        $this->candidates()
            ->where('is_finalist', true)
            ->update(['finalist_rank' => null]);

        // Attribuer le rang 1 au gagnant
        $candidate->finalist_rank = 1;
        $candidate->save();
    }

    /**
     * Vérifier si l'élection a déjà un gagnant
     */
    public function hasWinner(): bool
    {
        return $this->candidates()
            ->where('is_finalist', true)
            ->where('finalist_rank', 1)
            ->exists();
    }
    // ========== SCOPES ==========

    public function scopePublished($query)
    {
        return $query->whereIn('status', [ElectionStatus::PUBLISHED, ElectionStatus::ONGOING]);
    }

    public function scopeOngoing($query)
    {
        return $query->where('status', ElectionStatus::ONGOING);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('status', ElectionStatus::PUBLISHED)
            ->where('start_at', '>', now());
    }

    public function scopeEnded($query)
    {
        return $query->where('status', ElectionStatus::CLOSED);
    }

    public function scopeByOrganization($query, int $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeByStatus($query, ElectionStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeActiveVotable($query)
    {
        return $query->whereIn('status', [ElectionStatus::PUBLISHED, ElectionStatus::ONGOING])
            ->where('start_at', '<=', now())
            ->where('end_at', '>=', now());
    }

    public function scopeOpenForCandidacy(Builder $query): Builder
    {
        return $query
            // Règle 1 : public uniquement
            ->where('election_mode', 'public')

            // Règle 2 : published uniquement (pas ongoing)
            ->where('status', ElectionStatus::PUBLISHED->value)

            // Règle 3 : candidatures activées par l'admin
            ->where('accepts_candidates', true)

            // Règle 4a : fenêtre d'ouverture respectée
            ->where(function (Builder $q) {
                $q->whereNull('candidacy_start_at')
                    ->orWhere('candidacy_start_at', '<=', now());
            })

            // Règle 4b : fenêtre de clôture non expirée
            ->where(function (Builder $q) {
                $q->whereNull('candidacy_end_at')
                    ->orWhere('candidacy_end_at', '>=', now());
            })

            // Règle 5 : places disponibles
            ->where(function (Builder $q) {
                $q->where('max_candidates', 0)
                    ->orWhereRaw(
                        'max_candidates > (
                        SELECT COUNT(*) FROM candidates
                        WHERE candidates.election_id = elections.id
                        AND candidates.deleted_at IS NULL
                    )'
                    );
            });
    }


    // ========== ACCESSORS ==========


    public function getIsOngoingAttribute(): bool
    {
        return $this->status === ElectionStatus::ONGOING;
    }

    public function getIsPublishedAttribute(): bool
    {
        return $this->status === ElectionStatus::PUBLISHED;
    }

    public function getIsVotableAttribute(): bool
    {
        return  $this->status === ElectionStatus::ONGOING
            && $this->start_at <= now()
            && $this->end_at >= now();
    }

    public function getIsEditableAttribute(): bool
    {
        if ($this->status->isEditable()) {
            return true;
        }

        // Une élection en cours mais qui n'a encore reçu aucun vote peut
        // toujours être modifiée - rien ne serait invalidé par un
        // changement (titre, description, date de clôture, etc.).
        return $this->status === ElectionStatus::ONGOING && $this->total_votes === 0;
    }

    public function getProgressPercentageAttribute(): float
    {
        if (! $this->start_at || ! $this->end_at) {
            return 0;
        }

        $total = $this->start_at->diffInSeconds($this->end_at);
        $elapsed = $this->start_at->diffInSeconds(now());

        if ($total <= 0) {
            return 0;
        }

        return min(100, max(0, ($elapsed / $total) * 100));
    }

    /**
     * Indique si la phase de candidature est actuellement ouverte sur CET objet.
     * Miroir exact de scopeOpenForCandidacy, calculé en PHP sur l'instance chargée.
     * Exposé dans ElectionResource sous la clé 'is_open_for_candidacy'.
     */
    public function getIsOpenForCandidacyAttribute(): bool
    {
        // Règle 1 : public uniquement
        if ($this->election_mode !== 'public') {
            return false;
        }

        // Règle 2 : published uniquement
        if ($this->status->value !== 'published') {
            return false;
        }

        // Règle 3 : candidatures activées
        if (! $this->accepts_candidates) {
            return false;
        }

        $now = now();

        // Règle 4a : fenêtre d'ouverture
        if ($this->candidacy_start_at && $this->candidacy_start_at > $now) {
            return false;
        }

        // Règle 4b : fenêtre de clôture
        if ($this->candidacy_end_at && $this->candidacy_end_at < $now) {
            return false;
        }

        // Règle 5 : places disponibles
        if ($this->max_candidates > 0) {
            $currentCount = $this->candidates()->count();
            if ($currentCount >= $this->max_candidates) {
                return false;
            }
        }

        return true;
    }
    public function getRemainingTimeAttribute(): ?string
    {
        if (! $this->end_at) {
            return null;
        }

        if ($this->end_at < now()) {
            return 'Terminée';
        }

        $diff = now()->diff($this->end_at);

        if ($diff->days > 0) {
            return $diff->days . ' jour(s) restant(s)';
        }

        if ($diff->h > 0) {
            return $diff->h . ' heure(s) restante(s)';
        }

        return $diff->i . ' minute(s) restante(s)';
    }

    // ========== HELPERS ==========

    public function hasElectorVoted(Elector $elector): bool
    {
        return $this->votes()
            ->where('elector_id', $elector->id)
            ->where('status', 'completed')
            ->exists();
    }

    public function getTotalEligibleElectors(): int
    {
        return $this->electors()->where('status', 'active')->count();
    }

    public function needsElectorList(): bool
    {
        return in_array($this->election_mode, ['private', 'restricted']);
    }

    public function getParticipationRate(): float
    {
        if (! $this->needsElectorList()) {
            return 0;
        }

        $total = $this->getTotalEligibleElectors();

        if ($total === 0) {
            return 0;
        }

        return ($this->total_votes / $total) * 100;
    }

    public function publish(): void
    {
        $this->status = ElectionStatus::PUBLISHED;
        $this->published_at = now();
        $this->save();
    }

    public function start(): void
    {
        $this->status = ElectionStatus::ONGOING;
        $this->save();
    }

    public function close(): void
    {
        $this->status = ElectionStatus::CLOSED;
        $this->closed_at = now();
        $this->save();
    }

    public function cancel(): void
    {
        $this->status = ElectionStatus::CANCELLED;
        $this->save();
    }
}
