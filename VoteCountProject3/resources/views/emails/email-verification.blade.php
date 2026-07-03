<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification de votre adresse email</title>
</head>

<body
    style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                    {{-- Header --}}
                    <tr>
                        <td>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center"
                                        style="background:#1e3a5f;border-radius:12px 12px 0 0;padding:32px 40px;">
                                        <span
                                            style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                                            {{ config('app.name') }}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Card --}}
                    <tr>
                        <td
                            style="background:#ffffff;border-radius:0 0 12px 12px;padding:40px 48px 48px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                            <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;">
                                Bonjour {{ $userName }} 👋
                            </p>
                            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                                Merci de rejoindre <strong>{{ config('app.name') }}</strong>.<br>
                                Veuillez vérifier votre adresse email pour activer votre compte.
                            </p>

                            @if ($otpCode ?? null)
                                <p
                                    style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.8px;">
                                    Votre code de vérification
                                </p>
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                    <tr>
                                        <td align="center"
                                            style="background:#f0f4ff;border:2px dashed #4f7cff;border-radius:12px;padding:28px 20px;">
                                            <span
                                                style="font-size:42px;font-weight:800;letter-spacing:14px;color:#1e3a5f;font-family:'Courier New',monospace;">
                                                {{ $otpCode }}
                                            </span>
                                        </td>
                                    </tr>
                                </table>

                                <table width="100%" cellpadding="0" cellspacing="0"
                                    style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;margin-bottom:24px;">
                                    <tr>
                                        <td style="padding:12px 16px;font-size:13px;color:#92400e;line-height:1.5;">
                                            ⏱ Ce code expire dans <strong>10 minutes</strong>.<br>
                                            🔒 Ne partagez jamais ce code avec personne.
                                        </td>
                                    </tr>
                                </table>
                            @endif

                            @if ($verificationUrl ?? null)
                                <p
                                    style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.8px;">
                                    Ou cliquez sur le lien de vérification
                                </p>
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                    <tr>
                                        <td align="center" style="padding:8px 0;">
                                            <a href="{{ $verificationUrl }}"
                                                style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:8px;">
                                                ✉️ Vérifier mon adresse email
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p
                                    style="margin:0 0 24px;font-size:12px;color:#9ca3af;text-align:center;line-height:1.5;">
                                    Si le bouton ne fonctionne pas, copiez ce lien :<br>
                                    <span style="color:#4f7cff;word-break:break-all;">{{ $verificationUrl }}</span>
                                </p>
                            @endif

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                <tr>
                                    <td style="border-top:1px solid #e5e7eb;"></td>
                                </tr>
                            </table>

                            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                                Si vous n'avez pas créé de compte sur <strong>{{ config('app.name') }}</strong>,
                                ignorez simplement cet email.
                            </p>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td align="center" style="padding:24px 0 0;">
                            <p style="margin:0;font-size:12px;color:#9ca3af;">
                                © {{ date('Y') }} {{ config('app.name') }} · Tous droits réservés
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>

</html>
