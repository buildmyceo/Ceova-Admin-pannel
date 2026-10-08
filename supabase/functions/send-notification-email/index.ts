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
      role: incomingRole,
      department: incomingDepartment,
      inviterName: incomingInviter,
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

    // Handle automated activation / recovery / invitation link generation via Supabase Admin
    if (action === 'activate-user' || action === 'send-activation-email' || action === 'invite-member-orbit' || action === 'send-invitation') {
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
              ...(incomingRole ? { role: incomingRole } : {}),
              ...(incomingDepartment ? { department: incomingDepartment } : {}),
              status: 'pending',
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

      const roleDisplay = (incomingRole || 'Member').toUpperCase();
      const departmentDisplay = incomingDepartment || (incomingRole === 'admin' ? 'Administration' : incomingRole === 'intern' ? 'Internship' : 'Development');
      const inviterDisplay = incomingInviter || 'CEOVA Administration';

      finalSubject = subject || "You're Invited to CEOVA Orbit — Set Your Password to Get Started";

      finalText = `You're Invited to CEOVA Orbit!\n\nHello,\n${inviterDisplay} has invited you to join the private CEOVA Orbit workspace as ${roleDisplay} (${departmentDisplay}).\n\nSet your password now and get started:\n${generatedActionLink}\n\nCEOVA Orbit • Enterprise Team OS`;

      finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to CEOVA Orbit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #07090e; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0f1422; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Glowing Gradient Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 34px 34px 22px; text-align: center; background-color: #111827; border-bottom: 1px solid #1e293b;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 16px auto;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="https://portal.ceovaai.com/ceovaimage.png" width="44" height="44" alt="CEOVA Orbit Logo" style="display: block; width: 44px; height: 44px; border-radius: 12px; background-color: #ffffff; padding: 4px; border: 1px solid rgba(255, 255, 255, 0.3);" />
                  </td>
                  <td style="vertical-align: middle; text-align: left;">
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; line-height: 1.1;">CEOVA <span style="color: #38bdf8;">ORBIT</span></div>
                    <div style="font-size: 9.5px; font-weight: 700; letter-spacing: 2.2px; text-transform: uppercase; color: #94a3b8; line-height: 1.1; margin-top: 2px;">Enterprise Team OS</div>
                  </td>
                </tr>
              </table>
              <div style="display: inline-block; padding: 6px 14px; background-color: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #38bdf8; text-transform: uppercase; margin-bottom: 10px;">
                CEOVA ORBIT &bull; OFFICIAL INVITATION
              </div>
              <h1 style="margin: 10px 0 6px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                You're Invited to CEOVA Orbit
              </h1>
              <p style="margin: 0; font-size: 14.5px; line-height: 1.5; color: #94a3b8;">
                Set your password now and get started with your workspace.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 34px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1;">
                Hello,
              </p>
              <p style="margin: 0 0 22px 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1;">
                <strong>${inviterDisplay}</strong> has invited you to join the private <strong>CEOVA Orbit</strong> team workspace. You have been granted workspace access to collaborate with the team, track initiatives, and access portal tools.
              </p>

              <!-- Assignment Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090d16; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #1e293b;">
                    <div style="font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Workspace</div>
                    <div style="font-size: 13.5px; font-weight: 700; color: #ffffff; margin-top: 3px;">CEOVA Orbit (portal.ceovaai.com)</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #1e293b;">
                    <div style="font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Invited Email</div>
                    <div style="font-size: 13.5px; font-weight: 600; color: #ffffff; margin-top: 3px;">${cleanEmail}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #1e293b;">
                    <div style="font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Assigned Role</div>
                    <div style="font-size: 13.5px; font-weight: 700; color: #38bdf8; margin-top: 3px;">${roleDisplay}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px;">
                    <div style="font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Department</div>
                    <div style="font-size: 13.5px; font-weight: 600; color: #e2e8f0; margin-top: 3px;">${departmentDisplay}</div>
                  </td>
                </tr>
              </table>

              <!-- Primary Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${generatedActionLink}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; text-align: center; padding: 15px 24px; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4); letter-spacing: 0.02em;">
                      Set Your Password &amp; Get Started &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Steps Guide -->
              <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 12px;">
                How to get started:
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-bottom: 10px;">
                    <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; background-color: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; text-align: center; font-size: 11px; font-weight: 700;">1</span>
                  </td>
                  <td style="padding-bottom: 10px; font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
                    Click the <strong>Set Your Password &amp; Get Started</strong> button above.
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-bottom: 10px;">
                    <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; background-color: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; text-align: center; font-size: 11px; font-weight: 700;">2</span>
                  </td>
                  <td style="padding-bottom: 10px; font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
                    Establish your personal secure password for <strong>${cleanEmail}</strong>.
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; width: 28px;">
                    <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; background-color: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; text-align: center; font-size: 11px; font-weight: 700;">3</span>
                  </td>
                  <td style="font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
                    Complete your quick profile details and start collaborating in CEOVA Orbit.
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; font-size: 12.5px; color: #94a3b8; line-height: 1.5;">
                <strong style="color: #cbd5e1;">Instant Setup:</strong> Clicking the link above establishes a direct session and guides you straight into password setup.
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
              <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
                This invitation was securely dispatched to <strong>${cleanEmail}</strong> by CEOVA Administration.
              </p>
              <p style="margin: 0; font-size: 10.5px; color: #475569;">
                CEOVA Orbit &bull; Enterprise Team OS &bull; <a href="https://portal.ceovaai.com" style="color: #64748b; text-decoration: none;">portal.ceovaai.com</a>
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
