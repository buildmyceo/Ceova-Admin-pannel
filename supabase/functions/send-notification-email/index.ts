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
    const { to, subject, message, title, apiKey: clientApiKey } = await req.json();

    const apiKey = Deno.env.get("RESEND_API") || Deno.env.get("RESEND_API_KEY") || clientApiKey;
    if (!apiKey) {
      throw new Error("Missing RESEND_API key in environment or request");
    }

    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if (recipients.length === 0) {
      throw new Error("Missing recipient email address");
    }

    const emailSubject = subject || "you have notification from ceova portal";
    const notificationContent = message || title || "New update in Ceova Portal";

    // Format requested by user:
    // "this notification is given to u because you have a notification in your dashboad check it there to and hers the message 
    // {notificatio}"
    const textContent = `this notification is given to u because you have a notification in your dashboad check it there to and hers the message \n\n${notificationContent}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background: #141416; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <tr>
      <td style="padding: 24px 28px; background: linear-gradient(135deg, #18181b 0%, #09090b 100%); border-bottom: 1px solid #27272a;">
        <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #a1a1aa; font-weight: 700;">CEOVA PORTAL</span>
        <h1 style="margin: 6px 0 0 0; font-size: 19px; color: #ffffff; font-weight: 700;">${emailSubject}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px;">
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.55; color: #d4d4d8;">
          this notification is given to u because you have a notification in your dashboad check it there to and hers the message
        </p>
        <div style="background: #09090b; border: 1px solid #27272a; border-left: 3px solid #60a5fa; border-radius: 6px; padding: 14px 16px; margin: 18px 0;">
          ${title ? `<div style="font-size: 13.5px; font-weight: 700; color: #ffffff; margin-bottom: 6px;">${title}</div>` : ''}
          <div style="font-size: 13px; color: #a1a1aa; line-height: 1.5; white-space: pre-wrap;">${notificationContent}</div>
        </div>
        <p style="margin: 22px 0 0 0; font-size: 12px; color: #71717a;">
          Please log into your Ceova Portal dashboard to review details, respond, or check deliverables.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 28px; background: #0c0c0e; border-top: 1px solid #27272a; text-align: center; font-size: 11px; color: #52525b;">
        Ceova Enterprise Portal &bull; Automated System Delivery
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
