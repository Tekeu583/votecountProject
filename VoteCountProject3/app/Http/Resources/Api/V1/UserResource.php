<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar_url,
            'gender' => $this->gender,
            'country' => $this->country,
            'city' => $this->city,
            'locale' => $this->locale,
            'timezone' => $this->timezone,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'email_verified' => $this->is_email_verified,
            'phone_verified' => $this->is_phone_verified,
            'two_factor_enabled' => $this->two_factor_enabled,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            'current_organization_role' => $this->current_organization_role ?? null,
            'current_election_role' => $this->current_election_role ?? null,

            'roles' => $this->whenLoaded('roles', fn() => $this->roles->pluck('name'), []),
            'permissions' => $this->getPermissionsArray(),
            'organizations' => $this->whenLoaded('organizations', function () {
                return $this->organizations->map(fn($org) => [
                    'uuid'   => $org->uuid,
                    'name'   => $org->name,
                    'logo'   => $org->logo_url ?? $org->logo,
                    'status' => $org->status,
                    'role'   => $org->pivot->role_slug,   // owner | admin | member | viewer
                ]);
            }, []),

        ];
    }

    private function getPermissionsArray(): array
    {
        // Guard against lazy loading: only get permissions if roles are loaded
        if (!$this->relationLoaded('roles')) {
            return [];
        }

        // Safely extract permissions from loaded roles only
        $permissions = collect();
        foreach ($this->roles as $role) {
            // Check if permissions are loaded on the role
            if ($role->relationLoaded('permissions')) {
                $permissions = $permissions->merge($role->permissions->pluck('name'));
            }
        }

        return $permissions->unique()->values()->toArray();
    }
}
