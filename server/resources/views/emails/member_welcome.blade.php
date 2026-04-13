<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BSNPM Member Account Details</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f7fb; font-family: Arial, Helvetica, sans-serif; color:#1f2937;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7fb; margin:0; padding:20px 0;">
        <tr>
            <td align="center" style="padding:0 10px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:720px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(15, 23, 42, 0.08);">
                    <tr>
                        <td style="background:#0f172a; padding:24px 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                                <tr>
                                    <td valign="top" style="display:block; width:100%; padding:0 0 14px 0;">
                                        <div style="font-size:20px; line-height:1.4; font-weight:700; color:#ffffff; letter-spacing:0.2px; word-break:break-word;">
                                            Babarwadi Snehbandh Nokardaranchi Patasanstha
                                        </div>
                                        <div style="font-size:13px; line-height:1.6; color:#dbeafe; margin-top:6px;">
                                            Official Member Account Communication
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td valign="top" align="left" style="display:block; width:100%;">
                                        <div style="display:inline-block; max-width:100%; padding:8px 14px; border:1px solid rgba(255,255,255,0.22); border-radius:999px; color:#ffffff; font-size:11px; font-weight:700; letter-spacing:0.8px; white-space:normal; word-break:break-word; line-height:1.5;">
                                            MEMBER ACCOUNT
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px 20px;">
                            <div style="font-size:13px; color:#6b7280; margin-bottom:8px;">
                                Date: {{ \Carbon\Carbon::now()->format('d M Y') }}
                            </div>

                            <div style="font-size:16px; font-weight:700; color:#111827; margin-bottom:18px; line-height:1.6; word-break:break-word;">
                                Dear {{ $member->full_name }},
                            </div>

                            <div style="font-size:14px; line-height:1.8; color:#374151; margin-bottom:24px;">
                                Welcome to the BSNPM member portal. Your member account has been created successfully by the administration team.
                                Please find your login credentials and account details below. We request you to keep these details secure and change your password after your first login, if applicable.
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; margin-bottom:24px; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
                                <tr>
                                    <td colspan="2" style="background:#eff6ff; padding:14px 16px; font-size:15px; font-weight:700; color:#1d4ed8; border-bottom:1px solid #dbeafe; line-height:1.6;">
                                        Member Account Details
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:38%; padding:13px 16px; font-size:13px; color:#6b7280; border-bottom:1px solid #f1f5f9; vertical-align:top; line-height:1.6;">
                                        Member Name
                                    </td>
                                    <td style="padding:13px 16px; font-size:14px; font-weight:700; color:#111827; border-bottom:1px solid #f1f5f9; vertical-align:top; line-height:1.7; word-break:break-word;">
                                        {{ $member->full_name }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:38%; padding:13px 16px; font-size:13px; color:#6b7280; border-bottom:1px solid #f1f5f9; vertical-align:top; line-height:1.6;">
                                        Member ID
                                    </td>
                                    <td style="padding:13px 16px; font-size:14px; font-weight:700; color:#111827; border-bottom:1px solid #f1f5f9; vertical-align:top; line-height:1.7; word-break:break-word;">
                                        {{ $member->member_id }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:38%; padding:13px 16px; font-size:13px; color:#6b7280; border-bottom:1px solid #f1f5f9; vertical-align:top; line-height:1.6;">
                                        Registered Email
                                    </td>
                                    <td style="padding:13px 16px; font-size:14px; font-weight:700; color:#111827; border-bottom:1px solid #f1f5f9; vertical-align:top; line-height:1.7; word-break:break-word;">
                                        {{ $member->email ?? '-' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:38%; padding:13px 16px; font-size:13px; color:#6b7280; vertical-align:top; line-height:1.6;">
                                        Login Password
                                    </td>
                                    <td style="padding:13px 16px; font-size:15px; font-weight:700; color:#b91c1c; vertical-align:top; line-height:1.7; word-break:break-word;">
                                        {{ $plainPassword }}
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; margin-bottom:24px; background:#fff7ed; border:1px solid #fed7aa; border-radius:12px;">
                                <tr>
                                    <td style="padding:16px;">
                                        <div style="font-size:15px; font-weight:700; color:#9a3412; margin-bottom:8px; line-height:1.6;">
                                            Important Security Instruction
                                        </div>
                                        <div style="font-size:13px; line-height:1.8; color:#7c2d12;">
                                            Please do not share your password with anyone. Keep your member ID and password confidential.
                                            If you face any issue while logging in, kindly contact the BSNPM support team or your concerned office representative.
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <div style="font-size:14px; line-height:1.8; color:#374151; margin-bottom:28px;">
                                We are pleased to welcome you as a member. You may now use your account credentials for authorized portal access and member-related services.
                            </div>

                            <div style="font-size:14px; color:#111827; font-weight:700; margin-bottom:4px;">
                                Regards,
                            </div>
                            <div style="font-size:14px; color:#374151; margin-bottom:2px;">
                                Administration Department
                            </div>
                            <div style="font-size:14px; line-height:1.6; color:#374151; text-transform: uppercase; word-break:break-word;">
                                {{ config('app.name') }}
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:18px 20px; background:#f8fafc; border-top:1px solid #e5e7eb;">
                            <div style="font-size:12px; line-height:1.8; color:#6b7280; text-align:center; word-break:break-word;">
                                This is a system-generated official communication from {{ config('app.name') }}. Please do not reply directly to this email.
                                For assistance, contact your branch or official support channel.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>