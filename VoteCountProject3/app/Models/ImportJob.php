<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImportJob extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'import_jobs';

    protected $fillable = [
        'uuid',
        'organization_id',
        'type',
        'file_path',
        'total_rows',
        'success_rows',
        'failed_rows',
        'status',
        'imported_by',
        'completed_at',
    ];

    protected $casts = [
        'total_rows' => 'integer',
        'success_rows' => 'integer',
        'failed_rows' => 'integer',
        'completed_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }

    public function errors(): HasMany
    {
        return $this->hasMany(ImportError::class);
    }

    public function markAsProcessing(): void
    {
        $this->status = 'processing';
        $this->save();
    }

    public function markAsCompleted(): void
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->save();
    }

    public function markAsFailed(): void
    {
        $this->status = 'failed';
        $this->completed_at = now();
        $this->save();
    }

    public function addError(int $rowNumber, string $errorMessage, array $rawData): void
    {
        $this->errors()->create([
            'row_number' => $rowNumber,
            'error_message' => $errorMessage,
            'raw_data' => $rawData,
        ]);

        $this->failed_rows++;
        $this->save();
    }

    public function addSuccess(): void
    {
        $this->success_rows++;
        $this->save();
    }
}
