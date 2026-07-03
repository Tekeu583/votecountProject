<?php

namespace App\Services;

use App\Models\SubscriptionPlan;
use Illuminate\Support\Str;

class SubscriptionPlanService
{
    public function create(array $data): SubscriptionPlan
    {
        $slug = Str::slug($data['name']);
        $originalSlug = $slug;
        $counter = 1;

        while (SubscriptionPlan::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }

        return SubscriptionPlan::create([
            'uuid' => Str::uuid()->toString(),
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'currency' => $data['currency'],
            'duration_days' => $data['duration_days'],
            'max_elections' => $data['max_elections'],
            'max_votes' => $data['max_votes'],
            'max_candidates' => $data['max_candidates'],
            'max_storage_gb' => $data['max_storage_gb'],
            'features' => $data['features'] ?? [],
            'status' => $data['status'] ?? 'active',
        ]);
    }

    public function update(SubscriptionPlan $plan, array $data): SubscriptionPlan
    {
        if (isset($data['name']) && $data['name'] !== $plan->name) {
            $slug = Str::slug($data['name']);
            $originalSlug = $slug;
            $counter = 1;

            while (SubscriptionPlan::where('slug', $slug)->where('id', '!=', $plan->id)->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }

            $data['slug'] = $slug;
        }

        if (isset($data['features'])) {
            $data['features'] = json_encode($data['features']);
        }

        $plan->update($data);

        return $plan->fresh();
    }
}
