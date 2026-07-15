<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;
use Illuminate\Support\Str;

class SubscriptionPlansSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Gratuit',
                'slug' => 'free',
                'description' => 'Pour démarrer votre projet électoral',
                'price' => 0,
                'currency' => 'XAF',
                'duration_days' => 60,
                'max_elections' => 20,
                'max_votes' => 100,
                'max_candidates' => 10,
                'max_storage_gb' => 1,
                'features' => [
                    '1 élection active',
                    'Jusqu\'à 100 votes',
                    '10 candidats par élection',
                    'Support par email',
                ],
                'status' => 'active',
            ],
            [
                'name' => 'Essentiel',
                'slug' => 'essentiel',
                'description' => 'Pour les organisations moyennes',
                'price' => 39900,
                'currency' => 'XAF',
                'duration_days' => 60,
                'max_elections' => 20,
                'max_votes' => 5000,
                'max_candidates' => 40,
                'max_storage_gb' => 5,
                'features' => [
                    '3 élections simultanées',
                    'Jusqu\'à 1 000 votes',
                    '30 candidats par élection',
                    'Support prioritaire',
                    'Analytics basiques',
                    'Export Excel',
                ],
                'status' => 'active',
            ],
            [
                'name' => 'Professionnel',
                'slug' => 'professional',
                'description' => 'Pour les organisations en croissance',
                'price' => 59900,
                'currency' => 'XAF',
                'duration_days' => 30,
                'max_elections' => 35,
                'max_votes' => 10000,
                'max_candidates' => 100,
                'max_storage_gb' => 20,
                'features' => [
                    '10 élections simultanées',
                    'Jusqu\'à 10 000 votes',
                    '100 candidats par élection',
                    'Support 24/7',
                    'Analytics avancés',
                    'Export Excel/PDF',
                    'API complète',
                    'Webhooks',
                ],
                'status' => 'active',
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Pour les grandes organisations',
                'price' => 199900,
                'currency' => 'XAF',
                'duration_days' => 30,
                'max_elections' => -1, // Illimité
                'max_votes' => -1,
                'max_candidates' => -1,
                'max_storage_gb' => 100,
                'features' => [
                    'Élections illimitées',
                    'Votes illimités',
                    'Candidats illimités',
                    'Support dédié',
                    'Analytics avancés',
                    'API complète',
                    'Webhooks',
                    'SSO (Single Sign-On)',
                    'SLA garantie 99.9%',
                    'Compte dédié',
                ],
                'status' => 'active',
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                array_merge($plan, ['uuid' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
