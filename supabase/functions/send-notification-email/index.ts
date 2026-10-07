import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.10";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

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
      action,
      password: setDirectPassword,
    } = await req.json();

    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if (recipients.length === 0) {
      throw new Error("Missing recipient email address");
    }

    const cleanEmail = recipients[0].trim().toLowerCase();
    const portalUrl = "https://portal.ceovaai.com";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://yuvkddpfcokqctomsbun.supabase.co";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    let finalHtml = customHtml;
    let finalSubject = subject;
    let finalText = customText;
    let generatedActionLink: string | null = null;

    // Handle first-time password setup for approved directory members
    if (action === 'first-time-setup-or-verify') {
      if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // 1. Verify user exists in public.profiles table
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (!profile) {
        return new Response(JSON.stringify({ 
          success: false, 
          firstTimeActivated: false, 
          error: "This email is not registered with CEOVA." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // 2. Find user in auth.users
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      let targetUser = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

      // A user is first-time if they have never signed in
      const isFirstTime = !targetUser || !targetUser.last_sign_in_at;

      if (isFirstTime && setDirectPassword && setDirectPassword.length >= 6) {
        if (!targetUser) {
          const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            email_confirm: true,
            password: setDirectPassword,
          });
          if (cErr) throw cErr;
          targetUser = created.user;
        } else {
          const { error: uErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
            password: setDirectPassword,
            email_confirm: true,
          });
          if (uErr) throw uErr;
        }

        // Ensure profile is marked active
        await supabaseAdmin
          .from('profiles')
          .update({ id: targetUser.id, status: 'active', updated_at: new Date().toISOString() })
          .ilike('email', cleanEmail);

        return new Response(JSON.stringify({ 
          success: true, 
          firstTimeActivated: true, 
          message: "First-time password set successfully!" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ 
        success: false, 
        firstTimeActivated: false, 
        debug: { 
          hasUser: !!targetUser, 
          lastSignIn: targetUser?.last_sign_in_at, 
          emailConfirmed: targetUser?.email_confirmed_at,
          identitiesCount: targetUser?.identities?.length
        },
        error: "Incorrect email or password. Please verify your credentials or click 'Forgot password?'." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle automated activation / recovery link generation via Supabase Admin
    if (action === 'activate-user' || action === 'send-activation-email') {
      if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin user activation.");
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // 1. Find user in auth.users or create if missing
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      let targetUser = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

      if (!targetUser) {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          ...(setDirectPassword ? { password: setDirectPassword } : {}),
        });
        if (createErr) throw new Error(`Failed to create user in auth: ${createErr.message}`);
        targetUser = created.user;
      } else {
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
          email_confirm: true,
          ...(setDirectPassword ? { password: setDirectPassword } : {}),
        });
        if (updateErr) throw new Error(`Failed to update user in auth: ${updateErr.message}`);
      }

      // 2. Synchronize profile in public.profiles table
      if (targetUser) {
        try {
          await supabaseAdmin
            .from('profiles')
            .update({
              id: targetUser.id,
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .ilike('email', cleanEmail);
        } catch (profErr) {
          console.warn("[Profile Sync Notice]", profErr);
        }
      }

      // 3. If direct password was supplied, we are done
      if (setDirectPassword) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: `User ${cleanEmail} password updated and account activated successfully!` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // 4. Generate authentic recovery/activation link
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
        options: {
          redirectTo: portalUrl,
        }
      });

      if (linkErr) {
        throw new Error(`Failed to generate activation link: ${linkErr.message}`);
      }

      generatedActionLink = linkData?.properties?.action_link || portalUrl;
      if (generatedActionLink) {
        try {
          const parsedLink = new URL(generatedActionLink);
          parsedLink.searchParams.set("redirect_to", portalUrl);
          generatedActionLink = parsedLink.toString();
        } catch (_) {}
      }
      finalSubject = subject || "[CEOVA] Account Activation: Set Your Workspace Password";

      finalText = `CEOVA Workspace Account Activation\n\nHello,\nYour CEOVA account (${cleanEmail}) is ready for activation.\n\nPlease click the link below to set your personal password and enter your workspace:\n${generatedActionLink}\n\nCEOVA Enterprise Team OS`;

      finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activate Your CEOVA Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080b11; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080b11; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0f1422; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Blue Bar -->
          <tr>
            <td style="height: 4px; background-color: #2563eb; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 30px 34px 20px; text-align: center; background-color: #111827; border-bottom: 1px solid #1e293b;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 14px auto;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="https://portal.ceovaai.com/ceovaimage.png" width="40" height="40" alt="CEOVA Logo" style="display: block; width: 40px; height: 40px; border-radius: 10px; background-color: #ffffff; padding: 4px; border: 1px solid #ffffff;" />
                  </td>
                  <td style="vertical-align: middle; text-align: left;">
                    <div style="font-size: 18px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; line-height: 1.1;">CEOVA</div>
                    <div style="font-size: 9.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; line-height: 1.1;">Enterprise Team OS</div>
                  </td>
                </tr>
              </table>
              <div style="display: inline-block; padding: 5px 12px; background-color: #1e293b; border: 1px solid #334155; border-radius: 6px; font-size: 10.5px; font-weight: 700; letter-spacing: 1.5px; color: #38bdf8; text-transform: uppercase;">
                ACCOUNT ACTIVATION
              </div>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.01em;">
                Activate Your Workspace Account
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 34px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1;">
                Hello,
              </p>
              <p style="margin: 0 0 22px 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1;">
                Your private workspace account (<strong>${cleanEmail}</strong>) is ready. Click the button below to set your personal password and enter the <strong>CEOVA Portal</strong>:
              </p>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${generatedActionLink}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 14px 22px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14.5px; font-weight: 700; border-radius: 8px; letter-spacing: 0.01em;">
                      Activate Account &amp; Set Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; font-size: 12.5px; color: #94a3b8; line-height: 1.5;">
                <strong style="color: #cbd5e1;">Next Steps:</strong> Clicking the link above will open the secure CEOVA portal and prompt you to establish your account password. Once saved, your account will be fully activated.
              </div>

              <!-- Fallback Link -->
              <p style="margin: 0; font-size: 11.5px; line-height: 1.5; color: #64748b; text-align: center; word-break: break-all;">
                Direct URL: <a href="${generatedActionLink}" style="color: #38bdf8; text-decoration: underline;">${generatedActionLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 34px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
                This activation link was generated securely for <strong>${cleanEmail}</strong>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.4;">
                CEOVA Enterprise Team OS &bull; <a href="https://portal.ceovaai.com" style="color: #64748b; text-decoration: none;">portal.ceovaai.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
    }

    const emailSubject = finalSubject || (title ? `[CEOVA] ${title}` : "CEOVA Workspace Notification");
    const notificationContent = message || title || "New update in CEOVA Portal";

    const textContent = finalText || `CEOVA Workspace Notification\n\n${title ? `${title}\n------------------------\n` : ''}${notificationContent}\n\nView details in your dashboard: ${portalUrl}\n\nCEOVA Enterprise Team OS`;

    const htmlContent = finalHtml || `
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
                <div style="font-size: 14.5px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">${notificationContent}</div>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 13px 22px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px; letter-spacing: 0.01em;">
                      Open Workspace Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link Fallback -->
              <p style="margin: 0; font-size: 11.5px; line-height: 1.5; color: #64748b; text-align: center;">
                Direct link: <a href="${portalUrl}" style="color: #38bdf8; text-decoration: underline;">${portalUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11.5px; color: #64748b; line-height: 1.5;">
                This notification was sent by <strong>CEOVA Enterprise Team OS</strong> to <strong>${cleanEmail}</strong>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.4;">
                &copy; ${new Date().getFullYear()} CEOVA AI. All rights reserved. &bull; <a href="${portalUrl}" style="color: #64748b; text-decoration: none;">portal.ceovaai.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 1. Primary Email Channel: Custom SMTP (Nodemailer)
    const smtpPassword = (Deno.env.get("SMTP_PASS") || Deno.env.get("SMTP_PASSWORD") || clientSmtpPass || "").replace(/\s+/g, '');
    const smtpUser = Deno.env.get("SMTP_USER") || clientSmtpUser || "ceova.ai@gmail.com";

    if (smtpPassword) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      const info = await transporter.sendMail({
        from: `"CEOVA Team OS" <${smtpUser}>`,
        to: recipients.join(", "),
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
      });

      return new Response(JSON.stringify({ 
        success: true, 
        method: "smtp", 
        messageId: info.messageId, 
        actionLink: generatedActionLink 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Secondary Fallback: Resend API
    const resendKey = Deno.env.get("RESEND_API") || Deno.env.get("RESEND_API_KEY") || clientApiKey;
    if (resendKey) {
      const fromAddress = "CEOVA Portal <onboarding@resend.dev>";
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

      return new Response(JSON.stringify({ success: true, method: "resend", data: resendData, actionLink: generatedActionLink }), {
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
