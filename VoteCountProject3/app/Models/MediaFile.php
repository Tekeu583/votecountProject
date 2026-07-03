<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaFile extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'media_files';

    protected $fillable = [
        'uuid',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
        'visibility',
        'checksum',
        'virus_scan_status',
        'uploaded_by',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    protected $attributes = [
        'visibility' => 'private',
        'virus_scan_status' => 'pending',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/'.$this->path);
    }

    public function markAsScanned(string $status): void
    {
        $this->virus_scan_status = $status;
        $this->save();
    }

    public function makePublic(): void
    {
        $this->visibility = 'public';
        $this->save();
    }
}
