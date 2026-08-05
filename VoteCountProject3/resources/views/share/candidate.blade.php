{{--
    Page servie UNIQUEMENT aux robots des réseaux sociaux (WhatsApp, Facebook,
    Twitter/X, Telegram, LinkedIn…), qui n'exécutent pas JavaScript et lisent le
    HTML brut. Elle n'existe que pour porter les balises Open Graph décrivant le
    candidat partagé.

    Un humain qui atterrirait ici malgré tout est renvoyé vers la vraie page.
--}}
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ $title }}</title>
    <meta name="description" content="{{ $description }}">
    <link rel="canonical" href="{{ $canonical }}">

    {{-- Open Graph : WhatsApp, Facebook, LinkedIn, Telegram --}}
    <meta property="og:type" content="profile">
    <meta property="og:site_name" content="VoteCount">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:title" content="{{ $title }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:url" content="{{ $canonical }}">
    <meta property="og:image" content="{{ $image }}">
    {{-- WhatsApp exige souvent la variante sécurisée pour afficher la vignette. --}}
    <meta property="og:image:secure_url" content="{{ $image }}">
    <meta property="og:image:alt" content="{{ $candidate->full_name }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">

    {{-- Twitter/X : sans summary_large_image, la vignette reste minuscule. --}}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $title }}">
    <meta name="twitter:description" content="{{ $description }}">
    <meta name="twitter:image" content="{{ $image }}">

    <meta http-equiv="refresh" content="0; url={{ $canonical }}">
</head>
<body>
    <p>
        Redirection vers la page de
        <a href="{{ $canonical }}">{{ $candidate->full_name }}</a>
        &mdash; {{ $election->title }}.
    </p>

    {{-- Repli si la redirection par méta n'est pas honorée. --}}
    <script>window.location.replace(@json($canonical));</script>
</body>
</html>
