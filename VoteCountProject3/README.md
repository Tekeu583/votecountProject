comment lancer le projet:

1- frontend:

ouvrer le terminale depuis le dossier frontendVotecount puis lancer la commande npm i,

ensuite lancer npm run dev et acceder a http://localhost:5173


2- backend:

ouvrer le terminale depuis VoteCountProject3 puis lancer **composer install**

ensuite lancer php artisan migrate en fin php artisan serve

ouvrer un autre terminal toujour depuis le dossier VoteCountProject3 puis lancer php artisan reverb:start

3- scheduler (indispensable — sans ça les élections ne démarrent/ne se ferment jamais automatiquement) :

la commande app/Console/Commands/ProcessElectionLifecycle.php (enregistrée dans routes/console.php) doit tourner chaque minute pour faire passer les élections de "published" à "ongoing" quand start_at arrive, et de "ongoing"/"published" à "closed" quand end_at arrive.

en développement (comme ci-dessus, terminal séparé) :

php artisan schedule:work

en production, ajouter cette ligne au crontab du serveur (crontab -e) :

* * * * * cd /chemin/vers/VoteCountProject3 && php artisan schedule:run >> /dev/null 2>&1

4- worker de file d'attente (indispensable — QUEUE_CONNECTION=redis, sans worker les jobs comme l'envoi d'OTP, le traitement des paiements ou les broadcasts temps réel ne sont jamais exécutés) :

IMPORTANT — certains jobs utilisent une file nommée "high" (ex: CalculateElectionResults, ImportCandidatesJob — voir `public string $queue` dans app/Jobs/*.php). `php artisan queue:work` seul n'écoute QUE la file "default" et ignore silencieusement "high" pour toujours (le job reste bloqué en attente, sans erreur, sans log) — toujours préciser `--queue=high,default`.

en développement (terminal séparé) :

php artisan queue:work --queue=high,default

en production, lancer avec un processus supervisé qui redémarre automatiquement (systemd/supervisor), pas juste la commande seule — sinon un crash du worker arrête silencieusement tous les jobs en arrière-plan. Exemple avec supervisor :

[program:votecount-worker]
command=php /chemin/vers/VoteCountProject3/artisan queue:work --queue=high,default --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=2
