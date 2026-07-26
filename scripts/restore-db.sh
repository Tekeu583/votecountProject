#!/usr/bin/env bash
#
# Restauration de la base PostgreSQL de VoteCount depuis un dump .sql.gz.
#
#     OPÉRATION DESTRUCTIVE : le dump a été créé avec --clean --if-exists,
#     il DROP puis recrée les objets. Les données actuelles seront écrasées.
#
# Usage :
#   ./scripts/restore-db.sh <fichier.sql.gz>
#   ./scripts/restore-db.sh                     # liste les backups disponibles
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

BACKUP_DIR="${PROJECT_ROOT}/backups"
POSTGRES_SERVICE="postgres"

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "✗ Ni « docker compose » ni « docker-compose » trouvés." >&2
  exit 1
fi

# -- Sans argument : lister les backups et sortir ------------------------------
if [ "$#" -lt 1 ]; then
  echo "Backups disponibles dans ${BACKUP_DIR} :"
  ls -1sh "${BACKUP_DIR}"/votecount_*.sql.gz 2>/dev/null || echo "  (aucun)"
  echo
  echo "Usage : $0 <fichier.sql.gz>"
  exit 0
fi

DUMP="$1"
# Autoriser soit un chemin complet, soit juste le nom de fichier dans backups/
[ -f "${DUMP}" ] || DUMP="${BACKUP_DIR}/${DUMP}"
if [ ! -f "${DUMP}" ]; then
  echo "✗ Fichier introuvable : $1" >&2
  exit 1
fi

echo "⚠️  Vous allez ÉCRASER la base actuelle avec :"
echo "    ${DUMP}"
read -r -p "Taper 'RESTORE' pour confirmer : " CONFIRM
if [ "${CONFIRM}" != "RESTORE" ]; then
  echo "Annulé."
  exit 1
fi

# Filet de sécurité : dump de l'état courant AVANT d'écraser.
echo "→ Sauvegarde de sécurité de l'état actuel avant restauration..."
"${SCRIPT_DIR}/backup-db.sh" pre-restore 30 || {
  echo "✗ Impossible de sauvegarder l'état actuel — restauration annulée." >&2
  exit 1
}

echo "→ Restauration en cours..."
gunzip -c "${DUMP}" | ${COMPOSE} exec -T "${POSTGRES_SERVICE}" sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'

echo "✓ Restauration terminée depuis ${DUMP}"
echo "→ Pensez à vider les caches applicatifs :"
echo "    ${COMPOSE} exec -T backend php artisan optimize:clear"
