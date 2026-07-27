# VoteCount — Plateforme de gestion d'élections en ligne

Plateforme de vote en ligne (public et privé) avec résultats en temps réel,
vote payant (Mobile Money via CamPay), gestion multi-organisations, jurys,
et tableaux de bord par rôle.

## Stack technique

**Backend**

- Laravel 13 / PHP 8.3+ (image Docker/CI en PHP 8.4)
- PostgreSQL (base de données)
- Redis (cache, sessions, queue)
- Laravel Reverb (WebSocket — résultats en temps réel)
- Laravel Sanctum (authentification API — cookies de session, jamais de Bearer token)

**Frontend**

- React 19 + Vite
- Tailwind CSS v4
- Laravel Echo + Pusher-js (client WebSocket)
- react-router-dom v7

**Paiement**

- CamPay (Mobile Money — MTN & Orange, Cameroun)
- Stripe, MTN MoMo, Orange Money (intégrations prévues, non testées en profondeur)

---

## Prérequis

Installez ces outils **avant** de commencer :

| Outil      | Version minimale | Vérifier avec          |
| ---------- | ---------------- | ----------------------- |
| PHP        | 8.3              | `php -v`              |
| Composer   | 2.x              | `composer -V`         |
| Node.js    | 20+              | `node -v`             |
| npm        | 10+              | `npm -v`              |
| PostgreSQL | 14+              | `psql --version`      |
| Redis      | 6+               | `redis-cli --version` |

Extensions PHP requises (généralement incluses avec PHP 8.3+) : `pdo_pgsql`, `mbstring`, `openssl`, `curl`, `json`, `bcmath`.

> Vous pouvez éviter d'installer PostgreSQL/Redis/PHP en local en utilisant
> **Docker** à la place — voir la section [Lancer avec Docker](#lancer-avec-docker).

---

## Structure du projet

```
votecountProject4/
├── VoteCountProject3/   # API Laravel (backend)
├── frontendVoteCount/   # Application React (frontend)
├── scripts/             # Scripts de sauvegarde de la base de données
├── docker-compose.yml   # Orchestration Docker (identique à la prod)
└── .github/workflows/   # CI/CD (tests + déploiement)
```

C'est un **monorepo** : backend et frontend vivent dans le même dépôt Git,
une seule branche `dev` est utilisée pour le développement.

---

## 1. Installation du backend

```bash
cd VoteCountProject3
composer install
```

### Configuration `.env`

```bash
cp .env.example .env
php artisan key:generate
```

`.env.example` contient déjà toutes les clés nécessaires avec des valeurs de
développement raisonnables. Éditez au minimum :

- `DB_PASSWORD` — le mot de passe de votre PostgreSQL local
- `MAIL_USERNAME` / `MAIL_PASSWORD` — un compte SMTP de test (Gmail avec mot
  de passe d'application, Mailtrap...) pour recevoir les OTP par email
- `REVERB_APP_ID` / `REVERB_APP_KEY` / `REVERB_APP_SECRET` — n'importe
  quelles valeurs, elles doivent juste être **identiques** côté frontend
  (voir plus bas)

Variables à connaître :

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=votecountproject3
DB_USERNAME=postgres
DB_PASSWORD=ton_password

# Queue — "redis" nécessite un worker séparé (voir étape 3), "sync" exécute
# les jobs immédiatement sans worker (plus simple pour un premier essai)
QUEUE_CONNECTION=redis

# ⚠️ IMPORTANT — origine(s) autorisée(s) à se connecter au WebSocket.
# Doit correspondre à l'URL du frontend (voir Dépannage si erreur
# "Origin not allowed").
REVERB_ALLOWED_ORIGINS=localhost,127.0.0.1

# Sanctum — domaines autorisés à s'authentifier via cookies (JAMAIS de Bearer token)
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
```

### Base de données

Créez la base PostgreSQL (le nom doit correspondre à `DB_DATABASE` du `.env`) :

```bash
createdb votecountproject3
```

Puis lancez les migrations :

```bash
php artisan migrate
```

⚠️ **Étape obligatoire** (pas une donnée de démo optionnelle) — ce seeder crée
les rôles et permissions (RBAC) sans lesquels **aucune** action protégée ne
fonctionne (inscription, création d'organisation, etc. échoueront avec une
erreur 403 "This action is unauthorized") :

```bash
php artisan db:seed
```

### Lien de stockage (photos candidats, bannières...)

```bash
php artisan storage:link
```

> Les dépendances de paiement (CamPay, Stripe, MTN/Orange Money) sont déjà
> déclarées dans `composer.json` — `composer install` les installe, aucune
> commande supplémentaire n'est nécessaire.

---

## 2. Installation du frontend

```bash
cd frontendVoteCount
npm install
```

### Configuration `.env`

```bash
cp .env.example .env
```

Le fichier `.env.example` du frontend contient déjà la structure attendue.
Éditez `VITE_REVERB_APP_ID`, `VITE_REVERB_APP_KEY` et `VITE_REVERB_APP_SECRET`
pour qu'ils soient **identiques** aux valeurs `REVERB_*` du backend.

⚠️ **Ce fichier `.env` n'est jamais dans le dépôt Git** (il est ignoré).
Chaque membre de l'équipe doit le créer localement à partir de `.env.example`.

---

## 3. Lancer le projet (installation manuelle)

Le projet nécessite **4 process en parallèle**, chacun dans un terminal séparé :

```bash
# Terminal 1 — API Laravel
cd VoteCountProject3
php artisan serve
```

```bash
# Terminal 2 — Serveur WebSocket (résultats en temps réel)
cd VoteCountProject3
php artisan reverb:start
```

```bash
# Terminal 3 — Worker de queue + scheduler (imports, calcul des résultats, OTP...)
cd VoteCountProject3
php artisan queue:work
php artisan schedule:work
```

```bash
# Terminal 4 — Frontend React
cd frontendVoteCount
npm run dev
```

Ouvrez ensuite **http://localhost:5173**.

> Le serveur WebSocket (Terminal 2) et le worker de queue (Terminal 3) sont
> indispensables — sans eux, l'application fonctionne mais aucun résultat ne
> se met à jour en direct, et les imports d'électeurs restent bloqués sur
> "import en cours".
>
> Pour éviter de lancer un worker séparé pendant le développement, vous
> pouvez mettre `QUEUE_CONNECTION=sync` dans le `.env` backend — les jobs
> s'exécutent alors immédiatement dans la requête qui les déclenche (Terminal
> 3 devient inutile, mais un import volumineux ralentira la requête HTTP).

---

## Lancer avec Docker

Alternative qui reproduit l'environnement de production (PostgreSQL, Redis,
backend avec queue/scheduler/Reverb via supervisord, frontend buildé et servi
par nginx) sans rien installer en local à part Docker.

```bash
# .env backend requis AVANT de lancer Docker (mêmes clés qu'en installation manuelle)
cd VoteCountProject3 && cp .env.example .env && cd ..

docker compose up -d --build
```

Puis, dans le conteneur backend :

```bash
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan db:seed
docker compose exec backend php artisan storage:link
```

Les services écoutent en local uniquement (`127.0.0.1`) :

| Service  | Port(s)       |
| -------- | ------------- |
| Backend  | `8000` (API), `8080` (Reverb) |
| Frontend | `3000`        |
| Postgres | `5432`        |
| Redis    | `6379`        |

> Ce mode Docker est celui utilisé en production sur le VPS (voir
> `.github/workflows/ci-cd.yml`). En local, l'installation manuelle
> (section précédente) reste plus pratique pour itérer avec le hot-reload
> de Vite.

---

## Sauvegardes de la base de données

Le dossier [`scripts/`](scripts/) contient les scripts de sauvegarde
PostgreSQL (utilisés automatiquement par le pipeline de déploiement avant
chaque migration, et par un cron quotidien sur le VPS) :

```bash
./scripts/backup-db.sh manual 14   # sauvegarde manuelle immédiate
./scripts/restore-db.sh            # liste les sauvegardes disponibles
./scripts/restore-db.sh <fichier.sql.gz>   # restaure (destructif, confirmation requise)
```

Nécessite que les conteneurs Docker (`docker compose up`) soient démarrés —
le `pg_dump`/`psql` s'exécute dans le conteneur `postgres`.

---

## Lancer les tests (backend)

La configuration de test est définie directement dans `phpunit.xml` (pas
besoin de `.env.testing`), y compris l'utilisateur/mot de passe PostgreSQL.
Créez d'abord la base attendue :

```bash
createdb votecountproject3_test
```

⚠️ `phpunit.xml` a un `DB_PASSWORD` codé en dur (`tarsenek`) pour
l'utilisateur `postgres`. Si votre PostgreSQL local a un autre mot de passe,
soit alignez-le localement, soit modifiez temporairement `DB_PASSWORD` dans
`phpunit.xml` **sans le commiter**.

```bash
cd VoteCountProject3
php artisan test
```

---

## Paiement CamPay (Mobile Money)

Le vote payant utilise [CamPay](https://www.campay.net) comme agrégateur MTN Mobile Money / Orange Money.

### Obtenir des identifiants de test

1. Créez un compte sur [demo.campay.net](https://demo.campay.net/fr/developer/applications/)
2. Enregistrez une application pour obtenir `CAMPAY_APP_ID`, `CAMPAY_ACCESS_TOKEN` et `CAMPAY_WEBHOOK_SECRET`
3. Renseignez ces valeurs dans le `.env` du backend

### ⚠️ Limites de l'environnement démo — à connaître avant de tester

- **Montant maximum : 25 XAF par transaction.** Pour tester le vote payant, configurez une élection avec un `vote_price` de 5 XAF ou moins.
- **Numéros de test** (aucun vrai débit n'est effectué) :

| Numéro          | Opérateur | Résultat simulé |
| ---------------- | ---------- | ----------------- |
| `237677777777` | MTN        | Succès           |
| `237677777770` | MTN        | Échec            |
| `237699999999` | Orange     | Succès           |
| `237699999990` | Orange     | Échec            |

Utiliser un vrai numéro personnel en environnement démo ne déclenche **aucune** transaction — seuls ces numéros sont reconnus.

---

## Dépannage — problèmes fréquents

### "Origin not allowed" dans le terminal Reverb

Le WebSocket refuse la connexion du navigateur. Vérifiez que `REVERB_ALLOWED_ORIGINS` (backend `.env`) contient l'URL affichée par `npm run dev` (attention à `localhost` vs `127.0.0.1`, et au port). Après modification :

```bash
php artisan config:clear
```

puis **arrêtez complètement et relancez** `php artisan reverb:start` (Ctrl+C, pas juste une modif à chaud).

### Les modifications de code PHP ne semblent pas prises en compte

Videz systématiquement le cache après un changement de `.env` ou de fichier de config :

```bash
php artisan optimize:clear
```

Si le comportement reste incohérent avec le code que vous voyez dans vos fichiers, redémarrez complètement le process `php artisan serve` (Ctrl+C puis relancer) — ne vous fiez pas uniquement à `optimize:clear`.

### Un import (électeurs...) reste bloqué sur "import en cours"

Le worker de queue (Terminal 3, `php artisan queue:work`) n'est pas lancé, ou
a planté. Vérifiez qu'il tourne toujours ; relancez-le si besoin. En dernier
recours pour du développement local, passez `QUEUE_CONNECTION=sync` dans le
`.env` (les jobs s'exécutent alors de façon synchrone, sans worker).

### CamPay renvoie `ER201 — Maximum amount is 25.00 XAF`

Vous êtes en environnement démo. Réduisez le `vote_price` de l'élection testée à 5 XAF ou moins (voir section Paiement CamPay ci-dessus).

### Erreur 500 générique sans détail

Le message renvoyé au frontend est volontairement générique. La vraie cause est dans les logs backend :

```bash
tail -n 50 storage/logs/laravel.log
```

Si `grep` sur ce fichier affiche `fichiers binaires correspondent` sans montrer les lignes, ajoutez `-a` :

```bash
grep -a "votre_recherche" storage/logs/laravel.log
```

### Après `git pull`, une nouvelle erreur de base de données apparaît

Une migration n'a probablement pas été exécutée :

```bash
php artisan migrate
```

### Erreur 403 "This action is unauthorized" (inscription, création d'organisation...)

Les rôles/permissions n'ont pas été seedés (étape considérée à tort comme
optionnelle). Corrige aussi les comptes déjà créés avec un rôle vide, sans
perte de données :

```bash
php artisan db:seed
```

---

## Notes de sécurité

- **Ne commitez jamais** vos fichiers `.env` (backend et frontend) — ils contiennent des secrets réels en production.
- Les identifiants CamPay/Stripe/MTN/Orange de ce README sont des exemples de structure, pas de vraies clés.
- Avant tout déploiement en production, remplacez `REVERB_ALLOWED_ORIGINS` par la liste stricte de vos vrais domaines (jamais de wildcard `*` en production).
- L'authentification utilise exclusivement des cookies de session Sanctum (SPA) — jamais de token Bearer, même pour du débogage.
