<?php

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Models\User;
use App\Services\RoleService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserController extends BaseApiController
{
    /**
     * Récupère tous les utilisateurs avec pagination
     * GET /api/v1/users
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        try {
            // Paramètres de pagination et filtrage
            $page = $request->get('page', 1);
            $limit = min((int)$request->get('limit', 15), 100); // Max 100
            $search = $request->get('search');
            $role = $request->get('role');
            $status = $request->get('status');

            // Construire la requête
            $query = User::with([
                'roles',
                'organizations',
                'elections',
                'mediaFiles',
                'notifications',
            ]);

            // Recherche par nom ou email
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Filtre par statut
            if ($status) {
                $query->where('status', $status);
            }

            // Filtre par rôle (utilise Spatie Permissions)
            if ($role) {
                $query->role($role);
            }

            // Pagination
            $paginated = $query->orderBy('created_at', 'desc')->paginate($limit, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'message' => 'Utilisateurs récupérés avec succès',
                'data' => [
                    'users' => $paginated->items(),
                    'data' => $paginated->items(), // Pour compatibilité
                    'pagination' => [
                        'total' => $paginated->total(),
                        'per_page' => $paginated->perPage(),
                        'current_page' => $paginated->currentPage(),
                        'last_page' => $paginated->lastPage(),
                        'from' => $paginated->firstItem(),
                        'to' => $paginated->lastItem(),
                    ]
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère les statistiques des utilisateurs
     * GET /api/v1/users/stats
     *
     * @return \Illuminate\Http\Response
     */
    public function stats()
    {
        try {
            $totalUsers = User::count();
            $activeUsers = User::where('status', 'Actif')->orWhere('status', 'active')->count();
            $inactiveUsers = User::where('status', 'Inactif')->orWhere('status', 'inactive')->count();

            // Utilisateurs créés aujourd'hui
            $newToday = User::whereDate('created_at', today())->count();

            // Utilisateurs avec dernier login aujourd'hui
            $activeToday = User::whereDate('last_login_at', today())->count();

            return response()->json([
                'success' => true,
                'message' => 'Statistiques récupérées',
                'data' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'inactive_users' => $inactiveUsers,
                    'new_today' => $newToday,
                    'active_today' => $activeToday,
                    'alerts' => 0 // À implémenter selon vos besoins
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Affiche un utilisateur spécifique
     * GET /api/v1/users/{id}
     *
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            $user = User::findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur récupéré',
                'data' => $user
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé',
                'error' => 'Not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crée un nouvel utilisateur
     * POST /api/v1/users
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        try {
            // Validation
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users',
                'phone' => 'nullable|string|max:20',
                'password' => 'required|string|min:8',
                'status' => 'nullable|in:Actif,Inactif,active,inactive',
                'role' => 'nullable|string'
            ]);

            // Créer l'utilisateur
            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => bcrypt($validated['password']),
                'status' => $validated['status'] ?? 'Actif',
            ]);

            // Assigner le rôle - par défaut "user" si non fourni
            $roleToAssign = $validated['role'] ?? 'user';
            RoleService::assignRoleToUser($user, $roleToAssign);

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur créé avec succès',
                'data' => $user
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Met à jour un utilisateur
     * PUT /api/v1/users/{id}
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            // Validation
            $validated = $request->validate([
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|unique:users,email,' . $id,
                'phone' => 'nullable|string|max:20',
                'password' => 'nullable|string|min:8',
                'status' => 'nullable|in:Actif,Inactif,active,inactive',
                'role' => 'nullable|string'
            ]);

            // Mettre à jour les champs
            if (isset($validated['first_name'])) $user->first_name = $validated['first_name'];
            if (isset($validated['last_name'])) $user->last_name = $validated['last_name'];
            if (isset($validated['email'])) $user->email = $validated['email'];
            if (isset($validated['phone'])) $user->phone = $validated['phone'];
            if (isset($validated['password'])) $user->password = bcrypt($validated['password']);
            if (isset($validated['status'])) $user->status = $validated['status'];

            $user->save();

            // Mettre à jour le rôle si fourni
            if (!empty($validated['role'])) {
                RoleService::syncUserRoles($user, $validated['role']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur mis à jour avec succès',
                'data' => $user
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé',
                'error' => 'Not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprime un utilisateur
     * DELETE /api/v1/users/{id}
     *
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);

            // Soft delete
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès'
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé',
                'error' => 'Not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporte les utilisateurs en CSV
     * GET /api/v1/users/export
     * 
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function export(Request $request)
    {
        try {
            $search = $request->get('search');
            $role = $request->get('role');
            $status = $request->get('status');

            $query = User::query();

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($status) {
                $query->where('status', $status);
            }

            if ($role) {
                $query->role($role);
            }

            $users = $query->get();

            $headers = [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => 'attachment; filename="users-' . now()->format('Y-m-d') . '.csv"',
            ];

            $callback = function () use ($users) {
                $file = fopen('php://output', 'w');

                // En-têtes
                fputcsv($file, ['ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Date de création']);

                // Données
                foreach ($users as $user) {
                    $roles = implode(', ', $user->getRoleNames()->toArray());
                    fputcsv($file, [
                        $user->id,
                        $user->first_name,
                        $user->last_name,
                        $user->email,
                        $user->phone,
                        $roles ?: 'N/A',
                        $user->status,
                        $user->created_at->format('Y-m-d H:i')
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
