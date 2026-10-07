import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, message, title, apiKey: clientApiKey, html: customHtml, text: customText } = await req.json();

    const apiKey = Deno.env.get("RESEND_API") || Deno.env.get("RESEND_API_KEY") || clientApiKey;
    if (!apiKey) {
      throw new Error("Missing RESEND_API key in environment or request");
    }

    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if (recipients.length === 0) {
      throw new Error("Missing recipient email address");
    }

    const emailSubject = subject || (title ? `[CEOVA] ${title}` : "CEOVA Workspace Notification");
    const notificationContent = message || title || "New update in CEOVA Portal";
    const portalUrl = "https://portal.ceovaai.com";

    const textContent = customText || `CEOVA Workspace Notification\n\n${title ? `${title}\n------------------------\n` : ''}${notificationContent}\n\nView details in your dashboard: ${portalUrl}\n\nCEOVA Enterprise Team OS`;

    const htmlContent = customHtml || `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #07090e; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background: #0f1422; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #38bdf8 0%, #3b82f6 50%, #6366f1 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 28px 34px 22px 34px; background: linear-gradient(180deg, #131b2e 0%, #0f1422 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Emblem & Brand -->
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%); border-radius: 10px; display: inline-block; text-align: center; line-height: 38px; font-size: 20px; font-weight: 800; color: #ffffff; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
                            ◈
                          </div>
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 17px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; line-height: 1.2;">CEOVA</div>
                          <div style="font-size: 9.5px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; line-height: 1.2;">Enterprise Team OS</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #38bdf8;">
                      NOTIFICATION
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 34px 34px 28px 34px;">
              <h1 style="margin: 0 0 10px 0; font-size: 21px; font-weight: 700; color: #ffffff; line-height: 1.35;">
                ${emailSubject}
              </h1>
              <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                You have received a new notification in your CEOVA workspace:
              </p>

              <!-- Message Callout Box -->
              <div style="background: #090d16; border: 1px solid rgba(255, 255, 255, 0.08); border-left: 4px solid #38bdf8; border-radius: 12px; padding: 20px; margin-bottom: 26px;">
                ${title && title !== emailSubject ? `<div style="font-size: 14px; font-weight: 700; color: #38bdf8; margin-bottom: 8px;">${title}</div>` : ''}
                <div style="font-size: 14px; color: #f1f5f9; line-height: 1.65; white-space: pre-wrap;">${notificationContent}</div>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 14px 22px; background: #2563eb; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 14.5px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.45); letter-spacing: 0.01em;">
                      Open Ceova Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link Fallback -->
              <p style="margin: 0; font-size: 11.5px; line-height: 1.5; color: #64748b; text-align: center;">
                Direct portal link: <a href="${portalUrl}" style="color: #38bdf8; text-decoration: underline;">${portalUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 34px; background: #0a0d16; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
                This notification was sent to your active account on CEOVA Enterprise OS.
              </p>
              <p style="margin: 0; font-size: 10.5px; color: #475569;">
                CEOVA Enterprise Intelligence &bull; Secure Team OS
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Resend API invocation
    const fromAddress = Deno.env.get("RESEND_FROM") || "Ceova Portal <onboarding@resend.dev>";
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromAddress,
        to: recipients,
        subject: emailSubject,
        text: textContent,
        html: htmlContent
      })
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      throw new Error(`Resend API error (${resendRes.status}): ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({ success: true, data: resendData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
