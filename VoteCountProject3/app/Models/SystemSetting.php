<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $table = 'system_settings';

    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    public static function getValue(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();

        if (! $setting) {
            return $default;
        }

        return $setting->value;
    }

    public static function setValue(string $key, $value, ?string $description = null): self
    {
        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => json_encode($value),
                'description' => $description,
            ]
        );
    }
}
