<?php

namespace App\Http\Controllers\Api\V1\Notifications;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Api\V1\NotificationResource;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Notifications in-app (cloche de notification / diffusion de messages
 * admin). N'existait nulle part avant : la table "notifications" et le
 * modèle Notification étaient utilisés en interne (voter_codes_sent,
 * export_ready...) mais aucune route API ne les exposait.
 */
class NotificationController extends BaseApiController
{
    /**
     * GET /api/v1/notifications
     * Le super admin voit toutes les notifications ; un utilisateur normal
     * ne voit que les siennes.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Notification::with('user')->orderByDesc('created_at');

        if (! $user->isSuperAdmin()) {
            $query->where('user_id', $user->id);
        } elseif ($request->filled('user_uuid')) {
            $target = User::where('uuid', $request->query('user_uuid'))->first();
            $query->where('user_id', $target?->id ?? 0);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->boolean('unread_only')) {
            $query->whereNull('read_at');
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('message', 'ilike', "%{$search}%");
            });
        }

        $notifications = $query->paginate($request->get('per_page', 15));

        return $this->paginated($notifications, NotificationResource::class);
    }

    /**
     * POST /api/v1/notifications
     * Envoie une notification in-app à un utilisateur. Réservé au super admin.
     */
    public function store(Request $request): JsonResponse
    {
        if (! Auth::user()->isSuperAdmin()) {
            return $this->forbidden('Accès réservé au super administrateur');
        }

        $validated = $request->validate([
            'user_uuid' => ['required', 'exists:users,uuid'],
            'title' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string'],
        ]);

        $target = User::where('uuid', $validated['user_uuid'])->firstOrFail();

        $notification = Notification::create([
            'user_id' => $target->id,
            'type' => 'admin_message',
            'title' => $validated['title'],
            'message' => $validated['message'],
            'data' => ['sent_by' => Auth::id()],
        ]);

        return $this->created(new NotificationResource($notification->load('user')), 'Notification envoyée avec succès');
    }

    /**
     * POST /api/v1/notifications/{notification}/mark-as-read
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        $user = Auth::user();
        if ($notification->user_id !== $user->id && ! $user->isSuperAdmin()) {
            return $this->forbidden('Accès non autorisé à cette notification');
        }

        $notification->markAsRead();

        return $this->success(new NotificationResource($notification->fresh('user')), 'Notification marquée comme lue');
    }

    /**
     * DELETE /api/v1/notifications/{notification}
     */
    public function destroy(Notification $notification): JsonResponse
    {
        $user = Auth::user();
        if ($notification->user_id !== $user->id && ! $user->isSuperAdmin()) {
            return $this->forbidden('Accès non autorisé à cette notification');
        }

        $notification->delete();

        return $this->noContent('Notification supprimée');
    }
}
