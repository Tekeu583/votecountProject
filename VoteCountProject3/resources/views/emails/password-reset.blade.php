<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de votre mot de passe</title>
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
                                        style="background:#7c1d1d;border-radius:12px 12px 0 0;padding:32px 40px;">
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

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                <tr>
                                    <td align="center"><span style="font-size:48px;">🔐</span></td>
                                </tr>
                            </table>

                            <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;text-align:center;">
                                Réinitialisation du mot de passe
                            </p>
                            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;text-align:center;">
                                Bonjour <strong>{{ $userName }}</strong>, nous avons reçu une demande de<br>
                                réinitialisation de votre mot de passe.
                            </p>

                            <p
                                style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.8px;text-align:center;">
                                Votre code de réinitialisation
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                <tr>
                                    <td align="center"
                                        style="background:#fff5f5;border:2px dashed #ef4444;border-radius:12px;padding:28px 20px;">
                                        <span
                                            style="font-size:42px;font-weight:800;letter-spacing:14px;color:#7c1d1d;font-family:'Courier New',monospace;">
                                            {{ $otpCode }}
                                        </span>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0"
                                style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;margin-bottom:24px;">
                                <tr>
                                    <td style="padding:12px 16px;font-size:13px;color:#92400e;line-height:1.5;">
                                        ⏱ Ce code expire dans <strong>15 minutes</strong>.<br>
                                        🔒 Ne partagez jamais ce code avec personne.<br>
                                        ❌ Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0"
                                style="background:#eff6ff;border-radius:8px;">
                                <tr>
                                    <td style="padding:14px 18px;font-size:12px;color:#1e40af;line-height:1.6;">
                                        🛡️ <strong>Rappel de sécurité :</strong> Notre équipe ne vous demandera jamais
                                        ce code par téléphone ou chat. Ce code ne fonctionne qu'une seule fois.
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td align="center" style="padding:24px 0 0;">
                            <p style="margin:0;font-size:12px;color:#9ca3af;">
                                © {{ date('Y') }} {{ config('app.name') }} · Tous droits réservés
                            </p>
                            <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">
                                Cet email a été envoyé à {{ $userEmail ?? '' }}
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>

</html>
