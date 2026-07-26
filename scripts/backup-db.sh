#!/usr/bin/env bash
#
# Sauvegarde de la base PostgreSQL de VoteCount.
#
# Le dump est produit DANS le conteneur postgres avec ses propres variables
# (POSTGRES_USER / POSTGRES_DB) : pas besoin de lire le .env de l'hôte, le
# résultat est toujours correct quel que soit le mode d'interpolation Compose.
#
# Usage :
#   ./scripts/backup-db.sh [label] [retention_jours]
#     label            : étiquette dans le nom de fichier (ex. cron, predeploy). Défaut: manual
#     retention_jours  : supprime les backups du MÊME label plus vieux que N jours. Défaut: 14
#
# Exemples :
#   ./scripts/backup-db.sh cron 14
#   ./scripts/backup-db.sh predeploy 7
#
set -euo pipefail

# -- Emplacement : racine du dépôt (dossier parent de scripts/) ----------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

LABEL="${1:-manual}"
RETENTION_DAYS="${2:-14}"
BACKUP_DIR="${PROJECT_ROOT}/backups"
POSTGRES_SERVICE="postgres"

# -- Détection de la commande compose (v2 « docker compose » ou v1) ------------
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "✗ Ni « docker compose » ni « docker-compose » trouvés." >&2
  exit 1
fi

# -- Le conteneur postgres doit tourner ----------------------------------------
if ! ${COMPOSE} ps --status running "${POSTGRES_SERVICE}" 2>/dev/null | grep -q "${POSTGRES_SERVICE}"; then
  echo "✗ Le service « ${POSTGRES_SERVICE} » n'est pas démarré." >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTFILE="${BACKUP_DIR}/votecount_${LABEL}_${TIMESTAMP}.sql.gz"
TMPFILE="${OUTFILE}.tmp"

echo "→ [${LABEL}] Sauvegarde en cours vers ${OUTFILE}"

# pg_dump dans le conteneur → gzip sur l'hôte. --clean --if-exists rend la
# restauration idempotente (drop avant recreate).
if ${COMPOSE} exec -T "${POSTGRES_SERVICE}" sh -c \
     'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges' \
     | gzip > "${TMPFILE}"; then
  mv "${TMPFILE}" "${OUTFILE}"
else
  rm -f "${TMPFILE}"
  echo "✗ Échec du pg_dump — aucun fichier écrit." >&2
  exit 1
fi

# -- Garde-fou : un dump vide/tronqué est un faux positif dangereux ------------
SIZE_BYTES="$(stat -c%s "${OUTFILE}" 2>/dev/null || stat -f%z "${OUTFILE}")"
if [ "${SIZE_BYTES}" -lt 1024 ]; then
  echo "✗ Backup suspect (${SIZE_BYTES} octets < 1 Ko), fichier supprimé." >&2
  rm -f "${OUTFILE}"
  exit 1
fi

echo "✓ Backup OK : $(du -h "${OUTFILE}" | cut -f1) — ${OUTFILE}"

# -- Purge des anciens backups du même label ----------------------------------─
if [ "${RETENTION_DAYS}" -gt 0 ]; then
  DELETED="$(find "${BACKUP_DIR}" -name "votecount_${LABEL}_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)"
  if [ "${DELETED}" -gt 0 ]; then
    echo "→ Purge : ${DELETED} backup(s) « ${LABEL} » de plus de ${RETENTION_DAYS} jours supprimé(s)."
  fi
fi
