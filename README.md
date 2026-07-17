# VoteCount — Plateforme de gestion d'élections en ligne

Plateforme de vote en ligne (public et privé) avec résultats en temps réel,
vote payant (Mobile Money via CamPay), gestion multi-organisations, jurys,
et tableaux de bord par rôle.

## Stack technique

**Backend**

- Laravel 13 / PHP 8.3
- PostgreSQL (base de données)
- Redis (cache, sessions)
- Laravel Reverb (WebSocket — résultats en temps réel)
- Laravel Sanctum (authentification API)

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

Extensions PHP requises (généralement incluses avec PHP 8.3) : `pdo_pgsql`, `mbstring`, `openssl`, `curl`, `json`, `bcmath`.

---

## Structure du projet

```
VoteCountProject/
├── backend/          # API Laravel
└── frontend/         # Application React
```

*(Adaptez les chemins ci-dessous si vos deux parties sont dans des dépôts séparés.)*

---

## 1. Installation du backend

```bash
cd backend
composer install
```

### Configuration `.env`

```bash
cp .env.example .env
php artisan key:generate
```

Éditez `.env` et renseignez au minimum ces valeurs :

```dotenv
APP_NAME=VoteCount
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Base de données — créez d'abord la base PostgreSQL (voir étape suivante)
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=votecount
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe

# Cache / Session (Redis)
CACHE_DRIVER=redis
SESSION_DRIVER=redis
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Queue — "sync" = exécution immédiate, pas besoin de worker séparé
QUEUE_CONNECTION=sync

# WebSocket (Reverb) — résultats en temps réel
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=un_id_au_choix
REVERB_APP_KEY=une_cle_au_choix
REVERB_APP_SECRET=un_secret_au_choix
REVERB_HOST=localhost
REVERB_PORT=8082
REVERB_SCHEME=http

# ⚠️ IMPORTANT — origines autorisées à se connecter au WebSocket.
# Doit correspondre EXACTEMENT à l'URL du frontend (voir section Dépannage
# si vous obtenez une erreur "Origin not allowed").
REVERB_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Sanctum — domaines autorisés à s'authentifier via cookies
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173

# Email (OTP, notifications) — un compte SMTP de test suffit (Gmail, Mailtrap...)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=

# CamPay (paiement Mobile Money) — voir section "Paiement CamPay" ci-dessous
CAMPAY_ENABLED=true
CAMPAY_BASE_URL=https://demo.campay.net/api
CAMPAY_APP_ID=
CAMPAY_USERNAME=
CAMPAY_PASSWORD=
CAMPAY_ACCESS_TOKEN=
CAMPAY_WEBHOOK_SECRET=
```

### Base de données

Créez la base PostgreSQL (adaptez le nom d'utilisateur si besoin) :

```bash
createdb votecount
```

Puis lancez les migrations :

```bash
php artisan migrate
```

Si des seeders existent pour des données de démonstration :

```bash
php artisan db:seed
```

### Lien de stockage (photos candidats, bannières...)

```bash
php artisan storage:link
```

### Dépendance additionnelle — CamPay

L'intégration CamPay valide la signature de ses webhooks via JWT. Installez la librairie requise :

```bash
composer require firebase/php-jwt
```

---

## 2. Installation du frontend

```bash
cd frontend
npm install
```

### Configuration `.env`

Créez un fichier `.env` **à la racine du dossier frontend** (à côté de `package.json`) :

```dotenv
VITE_BACKEND_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173

# Doivent correspondre EXACTEMENT aux valeurs REVERB_* du backend
VITE_REVERB_APP_KEY=une_cle_au_choix
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8082
VITE_REVERB_SCHEME=http
```

⚠️ **Ce fichier n'est jamais dans le dépôt Git** (normal, il est ignoré). Chaque membre de l'équipe doit le créer localement à partir de l'exemple ci-dessus.

---

## 3. Lancer le projet

Le projet nécessite **3 process en parallèle**, chacun dans un terminal séparé :

```bash
# Terminal 1 — API Laravel
cd backend
php artisan serve
```

```bash
# Terminal 2 — Serveur WebSocket (résultats en temps réel)
cd backend
php artisan reverb:start

php artisan queue:work

php artisan schedule:work
```

```bash
# Terminal 3 — Frontend React
cd frontend
npm run dev
```

Ouvrez ensuite **http://localhost:5173**.

> Le serveur WebSocket (Terminal 2) est indispensable — sans lui, l'application
> fonctionne mais aucun résultat ne se met à jour en direct.

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

Le WebSocket refuse la connexion du navigateur. Vérifiez que `REVERB_ALLOWED_ORIGINS` (backend `.env`) contient exactement l'URL affichée par `npm run dev` (attention à `localhost` vs `127.0.0.1`, et au port). Après modification :

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

---

## Notes de sécurité

- **Ne commitez jamais** vos fichiers `.env` (backend et frontend) — ils contiennent des secrets réels en production.
- Les identifiants CamPay/Stripe/MTN/Orange de ce README sont des exemples de structure, pas de vraies clés.
- Avant tout déploiement en production, remplacez `REVERB_ALLOWED_ORIGINS` par la liste stricte de vos vrais domaines (jamais de wildcard `*` en production).
