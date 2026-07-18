<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Votre code d'accès</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 40px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .logo {
            font-size: 28px;
            font-weight: 700;
            color: #1e40af;
        }

        .greeting {
            font-size: 18px;
            font-weight: 500;
            color: #1e293b;
            margin-bottom: 16px;
        }

        .message {
            color: #3c4249;
            line-height: 1.6;
            margin-bottom: 24px;
        }

        .code-box {
            background: #eff6ff;
            border: 2px dashed #3b82f6;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
        }

        .code {
            font-size: 32px;
            font-weight: 700;
            font-family: 'Courier New', monospace;
            letter-spacing: 4px;
            color: #1e40af;
            background: white;
            padding: 12px 24px;
            border-radius: 8px;
            display: inline-block;
            max-width: 100%;
            word-break: break-all;
            overflow-wrap: break-word;
            white-space: nowrap;
        }

        .btn {
            display: inline-block;
            background: #1e40af;
            color: white !important;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 16px 0;
        }

        .btn:hover {
            background: #1e3a8a;
        }

        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 24px;
            margin-top: 32px;
            font-size: 14px;
            color: #94a3b8;
            text-align: center;
        }

        .warning {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 14px;
            color: #dc2626;
            margin: 16px 0;
        }

        @media (max-width: 480px) {
            .code {
                font-size: 18px;
                letter-spacing: 2px;
                padding: 10px 16px;
                white-space: normal;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">VoteCount</div>
        </div>

        <!-- Greeting -->
        <div class="greeting">
            Bonjour {{ $electorFullName }},
        </div>

        <!-- Message -->
        <div class="message">
            Vous avez été inscrit(e) comme électeur(rice) pour l'élection :
            <strongs style="color: #1e40af;" >{{ $election->title }}</strongs>
            <br>
            <strong>Date de début :</strong> {{ $dateStart }}<br>
            <strong>Date de fin :</strong> {{ $dateEnd }}<br>
            <br>
            Pour accéder au vote, veuillez utiliser le code d'accès personnel ci-dessous. Ce code est
        </div>

        <!-- Code Box -->
        <div class="code-box">
            <div style="font-size:14px; color:#64748b; margin-bottom:8px;">
                Votre code d'accès personnel
            </div>
            <div class="code">{{ $voterCode }}</div>
            <div style="font-size:12px; color:#94a3b8; margin-top:8px;">
                Ce code est strictement confidentiel
            </div>
        </div>

        <!-- Button -->
        <div style="text-align: center;">
            <a href="{{ $voteUrl }}" class="btn">
                Accéder au vote
            </a>
        </div>

        <!-- Warning -->
        <div class="warning">
            Ne partagez ce code avec personne.
        </div>

        <!-- Footer -->
        <div class="footer">
            Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.
            <br>
            &copy; {{ date('Y') }} VoteCount - Tous droits réservés.
        </div>
    </div>
</body>

</html>
