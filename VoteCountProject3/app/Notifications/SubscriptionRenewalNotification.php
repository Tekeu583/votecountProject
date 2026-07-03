<?php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use App\Models\Notification as NotificationModel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SubscriptionRenewalNotification extends Notification
{
    use Queueable;

    public const TYPE_RENEWED  = 'renewed';
    public const TYPE_EXPIRING = 'expiring';
    public const TYPE_FAILED   = 'failed';
    public const TYPE_EXPIRED  = 'expired';

    public function __construct(
        protected Subscription $subscription,
        protected string $type,
        protected ?string $failReason = null,
    ) {}

    public function via(mixed $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $plan = $this->subscription->plan;
        $org  = $this->subscription->organization;

        $titles = [
            self::TYPE_RENEWED  => 'Abonnement renouvelé',
            self::TYPE_EXPIRING => 'Abonnement bientôt expiré',
            self::TYPE_FAILED   => 'Échec du renouvellement',
            self::TYPE_EXPIRED  => 'Abonnement expiré',
        ];

        if ($notifiable instanceof \App\Models\User) {
            NotificationModel::create([
                'user_id' => $notifiable->id,
                'type'    => 'subscription_' . $this->type,
                'title'   => $titles[$this->type] ?? 'Notification abonnement',
                'message' => "Plan « {$plan->name} » — organisation « {$org->name} ».",
                'data'    => [
                    'subscription_uuid' => $this->subscription->uuid,
                    'plan_name'         => $plan->name,
                    'organization_name' => $org->name,
                    'end_at'            => $this->subscription->end_at?->toIso8601String(),
                    'fail_reason'       => $this->failReason,
                ],
            ]);
        }
        return match ($this->type) {
            self::TYPE_RENEWED => (new MailMessage)
                ->subject("Abonnement renouvelé — {$org->name}")
                ->greeting("Bonjour {$notifiable->full_name},")
                ->line("L'abonnement **{$plan->name}** de votre organisation **{$org->name}** a été renouvelé avec succès.")
                ->line("Valable jusqu'au : **{$this->subscription->end_at->format('d/m/Y')}")
                ->action('Voir mon abonnement', url('/org/settings/subscription'))
                ->line('Merci de votre confiance.'),

            self::TYPE_EXPIRING => (new MailMessage)
                ->subject("Votre abonnement expire bientôt — {$org->name}")
                ->greeting("Bonjour {$notifiable->full_name},")
                ->line("L'abonnement **{$plan->name}** de **{$org->name}** expire dans **{$this->subscription->days_remaining} jour(s)**.")
                ->line("Date d'expiration : **{$this->subscription->end_at->format('d/m/Y H:i')}")
                ->action('Renouveler maintenant', url('/org/settings/subscription'))
                ->line("Si vous avez activé le renouvellement automatique, aucune action n'est requise."),

            self::TYPE_FAILED => (new MailMessage)
                ->subject("Échec du renouvellement — {$org->name}")
                ->greeting("Bonjour {$notifiable->full_name},")
                ->line("Le renouvellement automatique de l'abonnement **{$plan->name}** pour **{$org->name}** a échoué.")
                ->when($this->failReason, fn($m) => $m->line("Raison : {$this->failReason}"))
                ->line('Votre abonnement expirera à la date prévue si aucune action n\'est prise.')
                ->action('Renouveler manuellement', url('/org/settings/subscription'))
                ->line('Contactez le support si le problème persiste.'),

            self::TYPE_EXPIRED => (new MailMessage)
                ->subject("Abonnement expiré — {$org->name}")
                ->greeting("Bonjour {$notifiable->full_name},")
                ->line("L'abonnement **{$plan->name}** de **{$org->name}** a expiré.")
                ->line('Certaines fonctionnalités peuvent être limitées.')
                ->action('Renouveler mon abonnement', url('/org/settings/subscription'))
                ->line("Choisissez un plan pour continuer à utiliser la plateforme."),

            default => new MailMessage,
        };
    }
}
