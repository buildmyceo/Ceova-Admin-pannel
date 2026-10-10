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
      otp: incomingOtp,
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

    // 1. Action: Verify Invitation (Strict Check - Never creates any record)
    if (action === 'verify-invitation') {
      if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // Check profiles table first
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role, status, department')
        .ilike('email', cleanEmail)
        .maybeSingle();

      let invitation = null;
      if (!profile) {
        const { data: inv } = await supabaseAdmin
          .from('invitations')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();
        invitation = inv;
      }

      if (!profile && !invitation) {
        return new Response(JSON.stringify({ 
          success: true, 
          isInvited: false, 
          error: "This email is not invited to CEOVA Orbit. Access is restricted to invited team members only." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        isInvited: true, 
        name: profile?.full_name || invitation?.full_name || cleanEmail.split('@')[0].replace(/[._-]/g, ' '),
        role: profile?.role || invitation?.role || 'member',
        department: profile?.department || invitation?.department || '',
        status: profile?.status || 'pending',
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // --------------------------------------------------------------------------
    // ACTION: Send Activation OTP Code
    // --------------------------------------------------------------------------
    if (action === 'send-activation-otp') {
      if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // Strict check: User must be invited!
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      let invitation = null;
      if (!profile) {
        const { data: inv } = await supabaseAdmin
          .from('invitations')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();
        invitation = inv;
      }

      if (!profile && !invitation) {
        return new Response(JSON.stringify({ 
          success: false, 
          isInvited: false, 
          error: "Access Denied: This email is not invited to CEOVA Orbit. Account setup is restricted to invited members only." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Generate 6-digit numeric OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Store in otp_verifications table
      await supabaseAdmin
        .from('otp_verifications')
        .delete()
        .ilike('email', cleanEmail);

      const { error: insertErr } = await supabaseAdmin
        .from('otp_verifications')
        .insert({
          email: cleanEmail,
          otp_code: otpCode,
          expires_at: expiresAt,
          attempts: 0,
        });

      if (insertErr) {
        console.error("[OTP Store Error]", insertErr.message);
        throw new Error("Failed to store verification code: " + insertErr.message);
      }

      const memberName = profile?.full_name || invitation?.full_name || cleanEmail.split('@')[0];
      finalSubject = `[CEOVA Orbit] Your Account Activation Code: ${otpCode}`;
      finalText = `Hello ${memberName},\n\nYour 6-digit CEOVA Orbit account activation code is: ${otpCode}\n\nThis code will expire in 10 minutes. Enter this code on the activation screen to establish your workspace access.\n\nCEOVA Orbit • Enterprise Team OS`;

      finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Account Activation Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #07090e; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0f1422; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);">
          <tr>
            <td style="height: 4px; background: #16a34a; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 34px 34px 22px; text-align: center; background-color: #111827; border-bottom: 1px solid #1e293b;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 16px auto;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="https://portal.ceovaai.com/ceovaimage.png" width="44" height="44" alt="CEOVA Orbit Logo" style="display: block; width: 44px; height: 44px; border-radius: 12px; background-color: #ffffff; padding: 4px; border: 1px solid rgba(255, 255, 255, 0.3);" />
                  </td>
                  <td style="vertical-align: middle; text-align: left;">
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; line-height: 1.1;">CEOVA <span style="color: #4ade80;">ORBIT</span></div>
                    <div style="font-size: 9.5px; font-weight: 700; letter-spacing: 2.2px; text-transform: uppercase; color: #94a3b8; line-height: 1.1; margin-top: 2px;">Enterprise Team OS</div>
                  </td>
                </tr>
              </table>
              <div style="display: inline-block; padding: 6px 14px; background-color: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #4ade80; text-transform: uppercase; margin-bottom: 10px;">
                SECURITY VERIFICATION &bull; ONE-TIME CODE
              </div>
              <h1 style="margin: 10px 0 6px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                Your Activation Code
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #94a3b8;">
                Use the verification code below to activate your account.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 34px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong>${memberName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Enter this 6-digit one-time password (OTP) on the CEOVA Orbit activation page to complete your account setup:
              </p>
              
              <!-- Big Solid Soft Green OTP Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 22px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 18px 36px; background-color: rgba(34, 197, 94, 0.1); border: 2px dashed #16a34a; border-radius: 12px; text-align: center;">
                      <span style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #4ade80; font-family: 'Courier New', Courier, monospace; display: block; margin-left: 12px;">${otpCode}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; font-size: 12.5px; color: #94a3b8; line-height: 1.5;">
                <strong style="color: #4ade80;">⏱ Validity:</strong> This code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 34px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
                Delivered to <strong>${cleanEmail}</strong> for CEOVA Orbit workspace verification.
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

    // --------------------------------------------------------------------------
    // ACTION: Verify Activation OTP & Activate Account
    // --------------------------------------------------------------------------
    if (action === 'verify-activation-otp') {
      if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      if (!incomingOtp) {
        return new Response(JSON.stringify({ success: false, error: "Please enter the 6-digit verification code." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const cleanCode = String(incomingOtp).trim().replace(/\s+/g, '');

      // Retrieve OTP record
      const { data: record, error: fetchErr } = await supabaseAdmin
        .from('otp_verifications')
        .select('*')
        .ilike('email', cleanEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr || !record) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "No active verification code found for this email. Please request a new code." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Check expiration
      if (new Date() > new Date(record.expires_at)) {
        await supabaseAdmin.from('otp_verifications').delete().ilike('email', cleanEmail);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Verification code has expired (valid 10 mins). Please click 'Resend OTP' to get a new code." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Check max attempts (rate limiting)
      if (record.attempts >= 5) {
        await supabaseAdmin.from('otp_verifications').delete().ilike('email', cleanEmail);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Too many incorrect attempts. For security, please request a new verification code." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Check code match
      if (record.otp_code !== cleanCode) {
        await supabaseAdmin
          .from('otp_verifications')
          .update({ attempts: (record.attempts || 0) + 1 })
          .eq('id', record.id);

        return new Response(JSON.stringify({ 
          success: false, 
          error: "Incorrect verification code. Please check your email and try again." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // CODE IS VALID! Delete record to prevent reuse
      await supabaseAdmin.from('otp_verifications').delete().ilike('email', cleanEmail);

      // Verify user is invited
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      let invitation = null;
      if (!profile) {
        const { data: inv } = await supabaseAdmin
          .from('invitations')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();
        invitation = inv;
      }

      if (!profile && !invitation) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Account record not found. Please contact your workspace administrator." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Determine role, designation, and department accurately
      const resolvedRole = (invitation?.role || profile?.role || 'intern').toLowerCase();
      const resolvedName = profile?.full_name || invitation?.full_name || cleanEmail.split('@')[0];
      const resolvedDesignation = resolvedRole === 'intern' 
        ? 'Intern' 
        : resolvedRole === 'admin' 
          ? 'Administrator' 
          : resolvedRole === 'ceo' 
            ? 'Chief Executive Officer' 
            : 'Team Member';
      const resolvedDepartment = resolvedRole === 'intern' 
        ? 'Internship' 
        : resolvedRole === 'admin' 
          ? 'Administration' 
          : resolvedRole === 'ceo' 
            ? 'Executive' 
            : (invitation?.department || profile?.department || 'Development');

      // Create or update auth user with the chosen password
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      let targetUser = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

      if (!targetUser) {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: setDirectPassword,
          email_confirm: true,
          user_metadata: {
            full_name: resolvedName,
            role: resolvedRole,
            designation: resolvedDesignation,
            department: resolvedDepartment,
          }
        });
        if (createErr) throw new Error(`Failed to activate account: ${createErr.message}`);
        targetUser = created.user;
      } else {
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
          password: setDirectPassword,
          email_confirm: true,
          user_metadata: {
            full_name: resolvedName,
            role: resolvedRole,
            designation: resolvedDesignation,
            department: resolvedDepartment,
          }
        });
        if (updateErr) throw new Error(`Failed to activate account: ${updateErr.message}`);
      }

      // Activate profile with exact role and designation
      if (profile) {
        await supabaseAdmin
          .from('profiles')
          .update({
            id: targetUser.id,
            role: resolvedRole,
            designation: profile.designation && profile.designation !== 'Team Member' ? profile.designation : resolvedDesignation,
            department: profile.department && profile.department !== 'General' ? profile.department : resolvedDepartment,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .ilike('email', cleanEmail);
      } else if (invitation) {
        await supabaseAdmin
          .from('profiles')
          .insert({
            id: targetUser.id,
            email: cleanEmail,
            full_name: resolvedName,
            role: resolvedRole,
            designation: resolvedDesignation,
            department: resolvedDepartment,
            status: 'active',
            updated_at: new Date().toISOString()
          });
      }

      // Remove invitation if exists
      await supabaseAdmin.from('invitations').delete().ilike('email', cleanEmail);

      return new Response(JSON.stringify({ 
        success: true, 
        activated: true, 
        message: "Account verified and activated successfully! You can now sign in." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Action: Set Password & Dispatch Confirmation Email (Legacy Magiclink Fallback)
    if (action === 'activate-account-with-password' || action === 'activate-and-send-confirmation') {
      if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // STRICT GATE: Verify user is invited in public.profiles or invitations!
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      let invitation = null;
      if (!profile) {
        const { data: inv } = await supabaseAdmin
          .from('invitations')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();
        invitation = inv;
      }

      // If NOT invited: REJECT IMMEDIATELY. DO NOT create ANY user or profile!
      if (!profile && !invitation) {
        return new Response(JSON.stringify({ 
          success: false, 
          isInvited: false, 
          error: "Access Denied: This email is not invited to CEOVA Orbit. Account setup is restricted to invited members only." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (!setDirectPassword || setDirectPassword.length < 6) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Password must be at least 6 characters long." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // User IS invited: create or update auth user with the chosen password
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      let targetUser = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

      if (!targetUser) {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: setDirectPassword,
          email_confirm: true,
        });
        if (createErr) throw new Error(`Failed to create auth user: ${createErr.message}`);
        targetUser = created.user;
      } else {
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
          password: setDirectPassword,
          email_confirm: true,
        });
        if (updateErr) throw new Error(`Failed to update auth user: ${updateErr.message}`);
      }

      // Ensure profile ID matches auth ID and status is pending confirmation
      if (profile && profile.id !== targetUser.id) {
        try {
          await supabaseAdmin
            .from('profiles')
            .update({ id: targetUser.id, status: 'pending', updated_at: new Date().toISOString() })
            .ilike('email', cleanEmail);
        } catch (_) {}
      }

      // Generate authentic confirmation magiclink action link
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: cleanEmail,
        options: {
          redirectTo: portalUrl,
        }
      });

      if (linkErr) {
        throw new Error(`Failed to generate confirmation link: ${linkErr.message}`);
      }

      generatedActionLink = linkData?.properties?.action_link || portalUrl;
      if (generatedActionLink) {
        try {
          const parsedLink = new URL(generatedActionLink);
          parsedLink.searchParams.set("redirect_to", portalUrl);
          generatedActionLink = parsedLink.toString();
        } catch (_) {}
      }

      const memberName = profile?.full_name || cleanEmail.split('@')[0];
      const memberRole = (profile?.role || invitation?.role || 'Member').toUpperCase();

      finalSubject = "[CEOVA Orbit] Confirm Your Account & Enter Workspace";
      finalText = `Hello ${memberName},\n\nYour workspace password has been established. Click the confirmation link below to activate your account and enter CEOVA Orbit:\n\n${generatedActionLink}\n\nCEOVA Orbit • Enterprise Team OS`;

      finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Account & Enter CEOVA Orbit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #07090e; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0f1422; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);">
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
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
              <div style="display: inline-block; padding: 6px 14px; background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #34d399; text-transform: uppercase; margin-bottom: 10px;">
                ACCOUNT ACTIVATION &bull; EMAIL CONFIRMATION
              </div>
              <h1 style="margin: 10px 0 6px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                Confirm Your Account
              </h1>
              <p style="margin: 0; font-size: 14.5px; line-height: 1.5; color: #94a3b8;">
                Click below to complete activation and enter the workspace.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 34px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong>${memberName}</strong>,
              </p>
              <p style="margin: 0 0 22px 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1;">
                Your workspace password has been set. Click the button below to confirm your email and enter the private <strong>CEOVA Orbit</strong> workspace as <strong>${memberRole}</strong>.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${generatedActionLink}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; text-align: center; padding: 15px 24px; background: linear-gradient(135deg, #10b981 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4); letter-spacing: 0.02em;">
                      Confirm Email &amp; Enter CEOVA Orbit &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; font-size: 12.5px; color: #94a3b8; line-height: 1.5;">
                <strong style="color: #cbd5e1;">Future Logins:</strong> On future visits, you can use the standard <strong>Sign In</strong> tab with your email and the password you just established.
              </div>
              <p style="margin: 0; font-size: 11.5px; line-height: 1.5; color: #64748b; text-align: center; word-break: break-all;">
                Direct Confirmation Link: <a href="${generatedActionLink}" style="color: #38bdf8; text-decoration: underline;">${generatedActionLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 34px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
                This activation link was generated for <strong>${cleanEmail}</strong>.
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

    // 3. Handle first-time password setup for approved directory members (Legacy/Compat)
    if (action === 'first-time-setup-or-verify') {
      if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // Strictly verify user exists in profiles or invitations!
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      let invitation = null;
      if (!profile) {
        const { data: inv } = await supabaseAdmin
          .from('invitations')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();
        invitation = inv;
      }

      if (!profile && !invitation) {
        return new Response(JSON.stringify({ 
          success: false, 
          firstTimeActivated: false, 
          error: "This email is not invited to CEOVA Orbit." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Find user in auth.users
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      let targetUser = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

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
        error: "Incorrect email or password. Please verify your credentials or activate your account." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 4. Handle automated activation / recovery / invitation link generation via Supabase Admin
    if (action === 'activate-user' || action === 'send-activation-email' || action === 'invite-member-orbit' || action === 'send-invitation') {
      if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin user activation.");
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // STRICT GATE: Verify user is invited before creating or activating!
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      let invitation = null;
      if (!profile) {
        const { data: inv } = await supabaseAdmin
          .from('invitations')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();
        invitation = inv;
      }

      // If neither exists AND this is not an explicit admin invitation action with role, deny!
      if (!profile && !invitation && action !== 'invite-member-orbit' && action !== 'send-invitation') {
        return new Response(JSON.stringify({ 
          success: false, 
          isInvited: false, 
          error: "This email is not invited to CEOVA Orbit." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // 1. Find user in auth.users or create if invited
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
        from: `"CEOVA Orbit" <${smtpUser}>`,
        to: recipients.join(", "),
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
        priority: "high",
        headers: {
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
          "Importance": "high",
        },
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
