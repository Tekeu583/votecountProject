<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

trait IsCacheable
{
    public static function getCacheKey(string $key): string
    {
        return strtolower(class_basename(static::class))."_{$key}";
    }

    public function cacheTags(): array
    {
        return [
            static::getCacheKey('all'),
            static::getCacheKey($this->id),
            static::getCacheKey($this->uuid ?? $this->id),
        ];
    }

    protected static function bootIsCacheable(): void
    {
        if (app()->environment('testing')) {
            return;
        }
        static::saved(function ($model) {
            $model->clearModelCache();
        });

        static::deleted(function ($model) {
            $model->clearModelCache();
        });
    }

    public function clearModelCache(): void
    {
        try {
            $cacheKey = static::getCacheKey($this->id);
            Cache::forget($cacheKey);

            if ($this->uuid) {
                Cache::forget(static::getCacheKey("uuid_{$this->uuid}"));
            }

            Cache::forget(static::getCacheKey('all'));
        } catch (\Exception $e) {
            Log::warning('Cache clear failed: '.$e->getMessage());
        }
    }

    public static function cachedFind($id, int $minutes = 60): ?self
    {
        $cacheKey = static::getCacheKey("find_{$id}");

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $model = static::find($id);

        if ($model) {
            Cache::put($cacheKey, $model, now()->addMinutes($minutes));
        }

        return $model;
    }

    public static function cachedFindByUuid(string $uuid, int $minutes = 60): ?self
    {
        $cacheKey = static::getCacheKey("uuid_{$uuid}");

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $model = static::where('uuid', $uuid)->first();

        if ($model) {
            Cache::put($cacheKey, $model, now()->addMinutes($minutes));
        }

        return $model;
    }

    public static function cachedAll(int $minutes = 60): Collection
    {
        $cacheKey = static::getCacheKey('all');

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $models = static::all();
        Cache::put($cacheKey, $models, now()->addMinutes($minutes));

        return $models;
    }
}
