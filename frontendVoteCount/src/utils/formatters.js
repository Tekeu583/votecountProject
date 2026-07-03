/**
 * Formate une date en chaîne lisible (ex: 30 mai 2026)
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Retourne les classes CSS pour le badge de rôle
 * @param {string} role
 * @returns {string} Tailwind classes
 */
export const badgeRole = (role) => {
  switch (role?.toLowerCase()) {
    case 'super_admin':
      return 'bg-blue-100 text-blue-600';
    case 'admin_org':
      return 'bg-purple-100 text-purple-600';
    case 'votant':
      return 'bg-gray-100 text-gray-600';
    case 'jury':
      return 'bg-gray-200 text-gray-600';
    case 'candidat':
      return 'bg-yellow-100 text-yellow-600';
    case 'user':
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-gray-50 text-gray-400';
  }
};

/**
 * Retourne la configuration d'affichage du statut d'un utilisateur
 * @param {Object} user
 * @returns {Object} { text, color }
 */
export const getStatusDisplay = (user) => {
  const status = user?.status?.toLowerCase();

  switch (status) {
    case 'active':
    case 'actif':
      return { text: 'Actif', color: 'text-green-600' };
    case 'suspendue':
    case 'suspendu':
      return { text: 'Suspendu', color: 'text-yellow-600' };
    case 'inactive':
    case 'inactif':
      return { text: 'Inactif', color: 'text-red-600' };
    default:
      return { text: status || 'Inconnu', color: 'text-gray-400' };
  }
};
