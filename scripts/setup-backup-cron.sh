#!/usr/bin/env bash
#
# Installe (une seule fois, sur le VPS) le cron de sauvegarde quotidienne.
# Idempotent : relancer met simplement à jour la ligne cron existante.
#
# Cron posé : tous les jours à 03:00 (heure système = Africa/Douala sur le VPS),
# backup étiqueté « cron », rétention 14 jours, log dans backups/backup.log.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

BACKUP_SCRIPT="${SCRIPT_DIR}/backup-db.sh"
LOG_FILE="${PROJECT_ROOT}/backups/backup.log"
CRON_MARKER="# votecount-db-backup"
CRON_LINE="0 3 * * * cd ${PROJECT_ROOT} && ${BACKUP_SCRIPT} cron 14 >> ${LOG_FILE} 2>&1 ${CRON_MARKER}"

mkdir -p "${PROJECT_ROOT}/backups"
chmod +x "${BACKUP_SCRIPT}" "${SCRIPT_DIR}/restore-db.sh"

# Retire l'ancienne ligne (si présente) puis ajoute la nouvelle.
( crontab -l 2>/dev/null | grep -v "${CRON_MARKER}" || true; echo "${CRON_LINE}" ) | crontab -

echo "✓ Cron de backup installé :"
crontab -l | grep "${CRON_MARKER}"
echo
echo "→ Test manuel immédiat recommandé :"
echo "    ${BACKUP_SCRIPT} manual 14"
