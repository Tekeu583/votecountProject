<?php

namespace App\Models;

use App\Models\Candidate;
use App\Models\Election;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Category extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'categories';

    protected $fillable = [
        'uuid',
        'election_id',
        'name',
        'slug',
        'description',
        'icon',
        'banner',
        'color',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    protected $attributes = [
        'status' => 'active',
    ];

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }
    public function getBannerUrlAttribute(): ?string
    {
        return $this->banner ? Storage::url($this->banner) : null;
    }
    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }

    public function getCandidatesForElection($electionId)
    {
        return $this->candidates()
            ->where('election_id', $electionId)
            ->get();
    }

    /**
     * Catégories disponibles pour une élection donnée :
     *   - les catégories spécifiques à cette élection (election_id = $electionId)
     *   - les catégories globales (election_id IS NULL), réutilisables partout
     *
     * Utilisé par ElectionCategoryController::index() pour peupler le
     * sélecteur de catégorie à l'étape 2 du wizard de création de scrutin.
     *
     * @param Builder $query
     * @param int     $electionId
     */
    public function scopeAvailableFor(Builder $query, int $electionId): Builder
    {
        return $query
            ->where('status', 'active')
            ->where(function (Builder $q) use ($electionId) {
                $q->where('election_id', $electionId);
            });
    }
}
