<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportError extends Model
{
    use HasFactory;

    protected $table = 'import_errors';

    protected $fillable = [
        'import_job_id',
        'row_number',
        'error_message',
        'raw_data',
    ];

    protected $casts = [
        'raw_data' => 'array',
    ];

    public function importJob(): BelongsTo
    {
        return $this->belongsTo(ImportJob::class);
    }
}
