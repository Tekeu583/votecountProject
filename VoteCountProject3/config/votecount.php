<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Contournement de l'abonnement à la publication
    |--------------------------------------------------------------------------
    |
    | Autorise la publication d'une élection SANS abonnement actif. Réservé au
    | développement local : le défaut est `false`, donc en production (ou si
    | APP_ENV est mal configuré sur le serveur) l'abonnement reste EXIGÉ.
    |
    | Contrairement à l'ancien contrôle `! app()->isLocal()`, ce flag est
    | INDÉPENDANT de APP_ENV : un APP_ENV=local posé par erreur sur le VPS
    | n'ouvre plus la faille — il faut positionner explicitement cette variable.
    | Pour développer en local : ALLOW_PUBLISH_WITHOUT_SUBSCRIPTION=true
    |
    */
    'allow_publish_without_subscription' => env('ALLOW_PUBLISH_WITHOUT_SUBSCRIPTION', false),

];
