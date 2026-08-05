<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Journalise automatiquement les créations, modifications et suppressions.
 *
 * @mixin \Illuminate\Database\Eloquent\Model
 *
 * L'annotation @mixin est indispensable à l'analyse statique : un trait est
 * inspecté isolément, si bien que `static::created()`, `static::updated()`,
 * `static::deleted()` ou `$this->id` — tous fournis par le modèle Eloquent
 * hôte — étaient signalés comme indéfinis. Ils existent bel et bien à
 * l'exécution, puisque ce trait n'est appliqué qu'à des modèles.
 *
 * `restored()` et `forceDeleted()` restent signalés : ils proviennent de
 * SoftDeletes, que tous les modèles audités n'utilisent pas — d'où la garde
 * conditionnelle dans bootHasAudit().
 */
trait HasAudit
{
    protected static function bootHasAudit(): void
    {
        // Les écouteurs sont TOUJOURS enregistrés : le filtrage se fait dans
        // logAudit(). Court-circuiter ici lierait la décision au moment du boot
        // du modèle, rendant l'audit intestable — un test ne pourrait plus
        // l'activer après coup.
        static::created(function ($model) {
            $model->logAudit('created', $model->getAttributes(), null);
        });

        static::updated(function ($model) {
            $changes = $model->getChanges();

            // On ne conserve de l'état précédent que les champs réellement
            // modifiés. Auparavant l'enregistrement ENTIER était stocké (32
            // colonnes pour un utilisateur), ce qui gonflait la table et y
            // recopiait le hash du mot de passe à chaque connexion.
            $original = array_intersect_key($model->getOriginal(), $changes);

            if (! empty($changes)) {
                $model->logAudit('updated', $changes, $original);
            }
        });

        static::deleted(function ($model) {
            $isForceDeleting = method_exists($model, 'isForceDeleting') && $model->isForceDeleting();

            if (! $isForceDeleting) {
                $model->logAudit('deleted', null, $model->getAttributes());
            }
        });

        // restored/forceDeleted n'existent que sur les modèles utilisant
        // SoftDeletes — les enregistrer inconditionnellement fait planter le
        // boot (erreur "bootIfNotBooted... while it is being booted") sur
        // tout modèle HasAudit qui ne fait PAS de suppression douce (ex.
        // WithdrawalRequest).
        if (in_array(SoftDeletes::class, class_uses_recursive(static::class), true)) {
            static::restored(function ($model) {
                $model->logAudit('restored', $model->getAttributes(), null);
            });

            static::forceDeleted(function ($model) {
                $model->logAudit('force_deleted', null, $model->getAttributes());
            });
        }
    }

    public function logAudit(string $action, ?array $newValues = null, ?array $oldValues = null): void
    {
        // Unique interrupteur : piloté par config/audit.php (AUDIT_ENABLED).
        // Le test sur l'environnement « testing » qui figurait ici rendait la
        // traçabilité invérifiable — aucun test ne pouvait constater qu'une
        // entrée d'audit était bien écrite.
        if (! config('audit.enabled', true)) {
            return;
        }

        $newValues = $this->filterAuditValues($newValues);
        $oldValues = $this->filterAuditValues($oldValues);

        try {
            if (class_exists(AuditLog::class)) {
                $requestId = null;
                // ✅ Éviter l'erreur sur request()->id()
                try {
                    $requestId = request()->input('_request_id') ?? request()->header('X-Request-ID');
                } catch (\Exception $e) {
                    // Ignorer l'erreur
                }
                AuditLog::create([
                    'organization_id' => $this->organization_id ?? null,
                    'election_id' => $this->election_id ?? null,
                    // Auth::id() et non Auth::user()->id : ce trait s'exécute
                    // aussi hors requête HTTP (jobs en file, commandes console),
                    // où aucun utilisateur n'est authentifié. Auth::user() y est
                    // null, ce qui émettait un warning à chaque écriture d'audit
                    // déclenchée par un import ou un calcul de résultats.
                    'user_id' => Auth::id(),
                    'action' => $action,
                    'entity_type' => get_class($this),
                    'entity_id' => $this->id,
                    'old_values' => $oldValues,
                    'new_values' => $newValues,
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'created_at' => now(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log audit: ' . $e->getMessage());
        }
    }

    /**
     * Retire les champs techniques et masque les champs sensibles.
     *
     * Sans ce filtrage, une création ou une suppression recopiait l'intégralité
     * de l'enregistrement dans le journal — hash du mot de passe et jetons
     * compris — que toute personne habilitée à consulter l'audit pouvait lire.
     * Les champs masqués restent visibles en tant que champs modifiés, seule
     * leur valeur est remplacée.
     */
    protected function filterAuditValues(?array $values): ?array
    {
        if (empty($values)) {
            return $values;
        }

        $hidden  = config('audit.hidden', []);
        $ignored = config('audit.ignored', []);
        $mask    = config('audit.mask', '••••••');

        $filtered = [];

        foreach ($values as $key => $value) {
            if (in_array($key, $ignored, true)) {
                continue;
            }

            $filtered[$key] = in_array($key, $hidden, true) ? $mask : $value;
        }

        return $filtered;
    }

    private function getTraceId(): ?string
    {
        if (function_exists('request') && request()->hasHeader('X-Trace-Id')) {
            return request()->header('X-Trace-Id');
        }

        return null;
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'entity');
    }
}
