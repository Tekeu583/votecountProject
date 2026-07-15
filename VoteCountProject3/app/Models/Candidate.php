<?php

namespace App\Models;

use App\Services\CandidateAccountLinkService;
use App\Traits\HasAudit;
use App\Traits\HasSoftDeletesWithUser;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Candidate extends Model
{
    use HasAudit, HasFactory, HasSoftDeletesWithUser, HasUuid;

    protected $table = 'candidates';

    protected $fillable = [
        'uuid',
        'election_id',
        'category_id',
        'user_id',
        'full_name',
        'slug',
        'photo',
        'cover_photo',
        'bio',
        'manifesto',
        'slogan',
        'position',
        'candidate_number',
        'vote_count',
        'score_total',
        'ranking_score',
        'final_score',
        'rank',
        'status',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
        'deleted_by',
        'scheduled_permanent_delete_at',
        'is_finalist',
        'finalist_at',
        'finalist_rank',
        'email',
        'phone',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'vote_count' => 'integer',
        'score_total' => 'decimal:2',
        'ranking_score' => 'decimal:2',
        'final_score' => 'decimal:2',
        'rank' => 'integer',
        'deleted_at' => 'datetime',
        'scheduled_permanent_delete_at' => 'datetime',
        'is_finalist' => 'boolean',
        'finalist_at' => 'datetime',
        'finalist_rank' => 'integer',
    ];

    protected $attributes = [
        'status' => 'pending',
        'vote_count' => 0,
        'score_total' => 0,
        'ranking_score' => 0,
        'final_score' => 0,
        'is_finalist' => false,
    ];

    // ========== RELATIONS ==========

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function voteItems(): HasMany
    {
        return $this->hasMany(VoteItem::class);
    }

    public function juryScores(): HasMany
    {
        return $this->hasMany(JuryScore::class);
    }

    public function result(): HasOne
    {
        return $this->hasOne(Result::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CandidateDocument::class);
    }

    // ========== SCOPES ==========

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeByElection($query, int $electionId)
    {
        return $query->where('election_id', $electionId);
    }

    /**
     * Scope pour récupérer uniquement les finalistes
     */
    public function scopeFinalists($query)
    {
        return $query->where('is_finalist', true);
    }

    /**
     * Scope pour récupérer les non-finalistes
     */
    public function scopeNonFinalists($query)
    {
        return $query->where('is_finalist', false);
    }
    // ========== ACCESSORS ==========

    public function getIsApprovedAttribute(): bool
    {
        return $this->status === 'approved';
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo ? asset('storage/' . $this->photo) : null;
    }

    public function getCoverPhotoUrlAttribute(): ?string
    {
        return $this->cover_photo ? asset('storage/' . $this->cover_photo) : null;
    }
    /**
     * Numéro formaté pour l'affichage : "N°1", "N°2", etc.
     */
    public function getCandidateNumberLabelAttribute(): string
    {
        return 'N°' . ($this->candidate_number ?? '?');
    }

    /**
     * Rang ordinal pour l'affichage des résultats : "1er", "2ème", "3ème", etc.
     * Null si le rang n'a pas encore été calculé (élection en cours).
     */
    public function getRankLabelAttribute(): ?string
    {
        if (! $this->rank) {
            return null;
        }

        return match ($this->rank) {
            1       => '1er',
            default => $this->rank . 'ème',
        };
    }

    /**
     * Indique si ce candidat est en tête (rang = 1).
     */
    public function getIsLeadingAttribute(): bool
    {
        return $this->rank === 1;
    }

    public function getIsFinalistLabelAttribute(): string
    {
        return $this->is_finalist ? 'Finaliste' : 'Non finaliste';
    }

    public function getFinalistRankLabelAttribute(): ?string
    {
        if (!$this->finalist_rank) {
            return null;
        }

        $rank = $this->finalist_rank;

        return $rank . ($rank === 1 ? 'er' : 'ème');
    }
    // ========== HELPERS ==========

    public function approve(int $userId): void
    {
        $this->status = 'approved';
        $this->approved_by = $userId;
        $this->approved_at = now();
        $this->save();
    }

    public function reject(int $userId, string $reason): void
    {
        $this->status = 'rejected';
        $this->rejected_by = $userId;
        $this->rejected_at = now();
        $this->rejection_reason = $reason;
        $this->save();
    }

    public function updateScores(): void
    {
        $this->vote_count = $this->voteItems()->count();
        $this->save();
    }

    // Ajouter une méthode pour récupérer les documents par type
    public function getDocumentsByType(string $type): \Illuminate\Database\Eloquent\Collection
    {
        return $this->documents()->where('type', $type)->get();
    }

    // Ajouter une méthode pour vérifier si un type de document existe
    public function hasDocument(string $type): bool
    {
        return $this->documents()->where('type', $type)->exists();
    }

    // Dans app/Models/Candidate.php - AJOUTER UNE VALIDATION AUTOMATIQUE
    protected static function booted()
    {
        static::creating(function ($candidate) {
            if ($candidate->category_id) {
                $categoryBelongsToElection = Category::where('id', $candidate->category_id)
                    ->where('election_id', $candidate->election_id)
                    ->exists();

                if (!$categoryBelongsToElection) {
                    throw new \Exception('La catégorie n\'est pas associée à cette élection');
                }
            }
        });

        // Lie automatiquement le candidat à un compte VoteCount existant
        // (recherche par email) — couvre l'ajout manuel, l'import CSV et
        // l'approbation de candidature, tous passent par Candidate::create().
        static::created(function (Candidate $candidate) {
            CandidateAccountLinkService::linkIfAccountExists($candidate);
        });

        // Symétrique de created() ci-dessus : sans ça, supprimer un candidat
        // laisse le rôle election_user (role_slug='candidat') orphelin — le
        // compte reste bloqué "déjà affecté à cette élection" et ne peut plus
        // recevoir aucun autre rôle (jury/manager/observer), alors même que
        // sa candidature n'existe plus.
        static::deleted(function (Candidate $candidate) {
            CandidateAccountLinkService::unlink($candidate);
        });

        static::forceDeleted(function (Candidate $candidate) {
            CandidateAccountLinkService::unlink($candidate);
        });

        // Si le candidat est restauré depuis la corbeille, relier à nouveau
        // — restore() ne déclenche pas created(), donc sans ce hook le
        // compte ne retrouverait pas son rôle "candidat" sur l'élection.
        static::restored(function (Candidate $candidate) {
            CandidateAccountLinkService::relinkAfterRestore($candidate);
        });
    }

    /**
     * Promouvoir un candidat en finaliste
     */
    public function promoteToFinalist(?int $rank = null): void
    {
        $this->is_finalist = true;
        $this->finalist_at = now();

        if ($rank !== null) {
            $this->finalist_rank = $rank;
        }

        $this->save();
    }

    /**
     * Rétrograder un finaliste (le retirer des finalistes)
     */
    public function demoteFromFinalist(): void
    {
        $this->is_finalist = false;
        $this->finalist_at = null;
        $this->finalist_rank = null;
        $this->save();
    }

    /**
     * Vérifier si le candidat est finaliste
     */
    public function isFinalist(): bool
    {
        return $this->is_finalist;
    }
}
