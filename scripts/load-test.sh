#!/usr/bin/env bash
#
# Test de charge de l'API VoteCount (Apache Bench).
#
# Mesure, pour chaque endpoint et à concurrence croissante :
#   - le débit (requêtes/seconde)
#   - la latence médiane (p50) et le 95e centile (p95)
#   - le taux d'erreur
#
# Le 95e centile est l'indicateur qui compte : il décrit l'expérience des
# utilisateurs les moins bien servis, là où la moyenne masque les pics.
#
# Usage :
#   ./scripts/load-test.sh [BASE_URL] [REQUETES_PAR_PALIER]
#
# Exemples :
#   ./scripts/load-test.sh                              # http://127.0.0.1:8001, 300 req/palier
#   ./scripts/load-test.sh http://127.0.0.1:8001 500
#
# ⚠️  Ne pas viser un serveur de production en service : un test de charge
#     dégrade volontairement les temps de réponse des utilisateurs réels.
#
set -uo pipefail

BASE_URL="${1:-http://127.0.0.1:8001}"
REQUESTS="${2:-300}"
CONCURRENCY_LEVELS=(1 10 25 50 100)

# Endpoints publics (aucune authentification) représentatifs du trafic réel.
ENDPOINTS=(
  "/api/v1/elections/public|Liste publique des élections (vitrine)"
  "/api/v1/elections/public?search=election|Liste publique avec recherche (ILIKE)"
  "/api/v1/subscription-plans|Plans d'abonnement (référence légère)"
)

command -v ab >/dev/null 2>&1 || { echo "✗ Apache Bench (ab) absent : sudo apt install apache2-utils" >&2; exit 1; }

echo "═══════════════════════════════════════════════════════════════"
echo " TEST DE CHARGE — VoteCount API"
echo " Cible        : ${BASE_URL}"
echo " Requêtes     : ${REQUESTS} par palier de concurrence"
echo " Concurrence  : ${CONCURRENCY_LEVELS[*]}"
echo " Date         : $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════════"

for entry in "${ENDPOINTS[@]}"; do
  path="${entry%%|*}"
  label="${entry##*|}"

  # Vérification préalable : inutile de mesurer un endpoint en erreur.
  code="$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "${BASE_URL}${path}")"
  echo
  echo "───────────────────────────────────────────────────────────────"
  echo " ${label}"
  echo " ${path}  →  HTTP ${code}"
  echo "───────────────────────────────────────────────────────────────"
  if [ "${code}" != "200" ]; then
    echo " ✗ Ignoré (attendu HTTP 200)."
    continue
  fi

  printf " %-12s %12s %10s %10s %12s\n" "Concurrence" "Req/s" "p50 (ms)" "p95 (ms)" "Erreurs"

  for c in "${CONCURRENCY_LEVELS[@]}"; do
    out="$(ab -n "${REQUESTS}" -c "${c}" -s 60 -H 'Accept: application/json' "${BASE_URL}${path}" 2>/dev/null)"

    rps="$(awk '/Requests per second/ {print $4}'   <<<"${out}")"
    p50="$(awk '/^  50%/ {print $2}'                <<<"${out}")"
    p95="$(awk '/^  95%/ {print $2}'                <<<"${out}")"
    failed="$(awk '/Failed requests/ {print $3}'    <<<"${out}")"
    non2xx="$(awk '/Non-2xx responses/ {print $3}'  <<<"${out}")"

    # Un test qui n'aboutit pas doit se voir, pas afficher des cases vides.
    if [ -z "${rps}" ]; then
      printf " %-12s %12s %10s %10s %12s\n" "${c}" "—" "—" "—" "échec ab"
      continue
    fi

    errors="${failed:-0}"
    [ -n "${non2xx:-}" ] && errors="${errors} (+${non2xx} non-2xx)"

    printf " %-12s %12s %10s %10s %12s\n" "${c}" "${rps}" "${p50:-—}" "${p95:-—}" "${errors}"
  done
done

echo
echo "═══════════════════════════════════════════════════════════════"
echo " Terminé. Rappel de lecture :"
echo "  • Req/s   : débit soutenu par le serveur"
echo "  • p95     : 95 % des utilisateurs sont servis plus vite que cette valeur"
echo "  • Erreurs : doit rester à 0 — sinon la capacité maximale est dépassée"
echo "═══════════════════════════════════════════════════════════════"
