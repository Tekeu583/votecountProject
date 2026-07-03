<?php

namespace App\Models;

use App\Models\Candidate;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class CandidateDocument extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'candidate_documents';

    protected $fillable = [
        'uuid',
        'candidate_id',
        'type',
        'file_path',
        'uploaded_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    // ========== RELATIONS ==========

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    // ========== ACCESSORS ==========
    
    public function getFileUrlAttribute(): string
    {
        return Storage::url($this->file_path);
    }

    public function getFileSizeAttribute(): ?int
    {
        if (!Storage::exists($this->file_path)) {
            return null;
        }
        return Storage::size($this->file_path);
    }

    public function getFileSizeHumanAttribute(): string
    {
        $size = $this->file_size;
        if (!$size) return 'N/A';
        
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($size >= 1024 && $i < count($units) - 1) {
            $size /= 1024;
            $i++;
        }
        return round($size, 2) . ' ' . $units[$i];
    }

    public function getFileNameAttribute(): string
    {
        return basename($this->file_path);
    }

    public function getFileExtensionAttribute(): string
    {
        return pathinfo($this->file_path, PATHINFO_EXTENSION);
    }

    // ========== SCOPES ==========
    
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // ========== HELPERS ==========
    
    public function deleteFile(): bool
    {
        if (Storage::exists($this->file_path)) {
            return Storage::delete($this->file_path);
        }
        return true;
    }

    public function isImage(): bool
    {
        return in_array($this->file_extension, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    }

    public function isPdf(): bool
    {
        return $this->file_extension === 'pdf';
    }
}