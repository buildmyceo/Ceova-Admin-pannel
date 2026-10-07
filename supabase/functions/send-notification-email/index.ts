import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.10";

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
    const {
      to,
      subject,
      message,
      title,
      html: customHtml,
      text: customText,
      smtpPass: clientSmtpPass,
      smtpUser: clientSmtpUser,
      apiKey: clientApiKey,
    } = await req.json();

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
<body style="margin: 0; padding: 0; background-color: #080b11; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080b11; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0f1422; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Solid Accent Bar -->
          <tr>
            <td style="height: 4px; background-color: #2563eb; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background-color: #111827; border-bottom: 1px solid #1e293b;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Emblem & Brand -->
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="https://portal.ceovaai.com/ceovaimage.png" width="38" height="38" alt="CEOVA Logo" style="display: block; width: 38px; height: 38px; border-radius: 8px; background-color: #ffffff; padding: 4px; border: 1px solid #ffffff;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 17px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; line-height: 1.2;">CEOVA</div>
                          <div style="font-size: 9.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; line-height: 1.2;">Enterprise Team OS</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 5px 12px; background-color: #1e293b; border: 1px solid #334155; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #38bdf8;">
                      NOTIFICATION
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 34px 32px 28px 32px;">
              <h1 style="margin: 0 0 10px 0; font-size: 21px; font-weight: 700; color: #ffffff; line-height: 1.35;">
                ${emailSubject}
              </h1>
              <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                You have received a new notification in your CEOVA workspace:
              </p>

              <!-- Message Callout Box -->
              <div style="background-color: #090d16; border: 1px solid #1e293b; border-left: 4px solid #2563eb; border-radius: 10px; padding: 18px 20px; margin-bottom: 26px;">
                ${title && title !== emailSubject ? `<div style="font-size: 14px; font-weight: 700; color: #38bdf8; margin-bottom: 8px;">${title}</div>` : ''}
                <div style="font-size: 14px; color: #f1f5f9; line-height: 1.65; white-space: pre-wrap;">${notificationContent}</div>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 14px 22px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14.5px; font-weight: 700; border-radius: 8px; letter-spacing: 0.01em;">
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
            <td style="padding: 18px 32px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
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

    // 1. Prioritize Gmail SMTP dispatch
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = Number(Deno.env.get("SMTP_PORT")) || 465;
    const smtpUser = Deno.env.get("SMTP_USER") || Deno.env.get("SMTP_USERNAME") || clientSmtpUser || "ceova.ai@gmail.com";
    const smtpPass = Deno.env.get("SMTP_PASS") || Deno.env.get("SMTP_PASSWORD") || clientSmtpPass;
    const senderName = Deno.env.get("SMTP_SENDER_NAME") || "Ceova Orbit";

    if (smtpPass) {
      console.log(`[SMTP Email] Delivering via ${smtpHost}:${smtpPort} as ${smtpUser} to:`, recipients);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${smtpUser}>`,
        to: recipients.join(", "),
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
      });

      console.log("[SMTP Email] Successfully dispatched messageId:", info.messageId);
      return new Response(JSON.stringify({ success: true, method: "smtp", messageId: info.messageId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Fallback to Resend if SMTP password is not set
    const resendKey = Deno.env.get("RESEND_API") || Deno.env.get("RESEND_API_KEY") || clientApiKey;
    if (resendKey) {
      const fromAddress = Deno.env.get("RESEND_FROM") || "Ceova Portal <onboarding@resend.dev>";
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: recipients,
          subject: emailSubject,
          text: textContent,
          html: htmlContent,
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        throw new Error(`Resend API error (${resendRes.status}): ${JSON.stringify(resendData)}`);
      }

      return new Response(JSON.stringify({ success: true, method: "resend", data: resendData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("No SMTP password or email provider configured in Edge Function.");
  } catch (error: any) {
    console.error("[Email Error]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
