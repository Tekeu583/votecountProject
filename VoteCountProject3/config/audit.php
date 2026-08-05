<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Activation du journal d'audit
    |--------------------------------------------------------------------------
    |
    | Le trait HasAudit consultait déjà `config('audit.enabled')`, mais ce
    | fichier n'existait pas : la valeur par défaut s'appliquait donc toujours
    | et le réglage était inopérant. Il est désormais réel et pilotable par
    | l'environnement — désactivé pendant les tests (voir phpunit.xml) pour ne
    | pas alourdir la suite, et réactivable ponctuellement dans un test dédié.
    |
    */

    'enabled' => env('AUDIT_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Champs masqués
    |--------------------------------------------------------------------------
    |
    | Le journal enregistre l'état complet de l'enregistrement lors d'une
    | création ou d'une suppression. Sans filtrage, le hash du mot de passe et
    | les jetons d'authentification s'y retrouvaient — et devenaient visibles
    | par toute personne pouvant consulter le journal.
    |
    | Ces champs sont remplacés par une valeur neutre : on conserve la trace
    | qu'ils ont changé, sans exposer leur contenu.
    |
    */

    'hidden' => [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'api_token',
        'voter_code',
    ],

    /*
    |--------------------------------------------------------------------------
    | Champs ignorés
    |--------------------------------------------------------------------------
    |
    | Horodatages techniques modifiés à chaque écriture : les journaliser
    | produirait une entrée « Modifié » sans information utile.
    |
    */

    'ignored' => [
        'updated_at',
        'created_at',
    ],

    /*
    | Valeur affichée à la place d'un champ masqué.
    */
    'mask' => '••••••',

];
