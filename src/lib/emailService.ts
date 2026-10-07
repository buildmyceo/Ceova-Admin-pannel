import { getSupabaseClient } from './supabase';
import { AppNotification, Profile } from '../types';

export const RESEND_STORAGE_KEY = 'ceova_resend_api_key';
export const SMTP_PASSWORD_KEY = 'ceova_smtp_password';
export const SMTP_USER_KEY = 'ceova_smtp_user';

export const getSmtpPassword = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_SMTP_PASSWORD) return String(import.meta.env.VITE_SMTP_PASSWORD).trim();
      if (import.meta.env.VITE_SMTP_PASS) return String(import.meta.env.VITE_SMTP_PASS).trim();
      if ((import.meta.env as any).SMTP_PASSWORD) return String((import.meta.env as any).SMTP_PASSWORD).trim();
    }
  } catch {}
  try {
    const stored = localStorage.getItem(SMTP_PASSWORD_KEY);
    if (stored) return stored.trim();
  } catch {}
  return '';
};

export const saveSmtpPassword = (pass: string) => {
  try {
    if (pass.trim()) {
      localStorage.setItem(SMTP_PASSWORD_KEY, pass.trim());
    } else {
      localStorage.removeItem(SMTP_PASSWORD_KEY);
    }
  } catch {}
};

/**
 * Retrieve the Resend API Key from available configuration sources:
 * 1. Vite environment variables (VITE_RESEND_API, RESEND_API)
 * 2. Node/process environment (if defined in vite build)
 * 3. LocalStorage config
 */
export const getResendApiKey = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_RESEND_API) return String(import.meta.env.VITE_RESEND_API).trim();
      if ((import.meta.env as any).RESEND_API) return String((import.meta.env as any).RESEND_API).trim();
      if ((import.meta.env as any).VITE_RESEND_API_KEY) return String((import.meta.env as any).VITE_RESEND_API_KEY).trim();
    }
  } catch {}

  try {
    const proc = (globalThis as any).process;
    if (proc && proc.env && proc.env.RESEND_API) {
      return String(proc.env.RESEND_API).trim();
    }
  } catch {}

  try {
    const stored = localStorage.getItem(RESEND_STORAGE_KEY) || localStorage.getItem('RESEND_API');
    if (stored) return stored.trim();
  } catch {}

  return '';
};

export const saveResendApiKey = (key: string) => {
  try {
    if (key.trim()) {
      localStorage.setItem(RESEND_STORAGE_KEY, key.trim());
      localStorage.setItem('RESEND_API', key.trim());
    } else {
      localStorage.removeItem(RESEND_STORAGE_KEY);
      localStorage.removeItem('RESEND_API');
    }
  } catch (err) {
    console.error('Failed saving RESEND_API key to local storage:', err);
  }
};

export interface SendEmailPayload {
  to: string | string[];
  subject?: string;
  title?: string;
  message: string;
  html?: string;
  text?: string;
  actionUrl?: string;
  actionText?: string;
  badge?: string;
}

export interface SendInvitationPayload {
  to: string;
  role?: string;
  department?: string;
  inviterName?: string;
}

/**
 * Generates an executive-grade, responsive HTML invitation email
 */
export function generateInvitationHtml(params: {
  email: string;
  role?: string;
  department?: string;
  inviterName?: string;
}): string {
  const portalUrl = 'https://portal.ceovaai.com';
  const roleDisplay = (params.role || 'Member').toUpperCase();
  const departmentDisplay = params.department || (params.role === 'admin' ? 'Administration' : params.role === 'intern' ? 'Internship' : 'Development');
  const inviterDisplay = params.inviterName || 'CEOVA Administration';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join CEOVA</title>
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
            <td style="padding: 32px 34px 22px; text-align: center; background-color: #111827; border-bottom: 1px solid #1e293b;">
              <!-- CEOVA Logo -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 14px auto;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="https://portal.ceovaai.com/ceovaimage.png" width="42" height="42" alt="CEOVA Logo" style="display: block; width: 42px; height: 42px; border-radius: 10px; background-color: #ffffff; padding: 4px; border: 1px solid #ffffff;" />
                  </td>
                  <td style="vertical-align: middle; text-align: left;">
                    <div style="font-size: 19px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; line-height: 1.1;">CEOVA</div>
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; line-height: 1.1;">Enterprise Team OS</div>
                  </td>
                </tr>
              </table>
              <div style="display: inline-block; padding: 5px 12px; background-color: #1e293b; border: 1px solid #334155; border-radius: 6px; font-size: 10.5px; font-weight: 700; letter-spacing: 1.5px; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">
                Official Workspace Invitation
              </div>
              <h1 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.01em;">
                You're invited to join CEOVA
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 24px 34px 30px;">
              <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1;">
                Hello,
              </p>
              <p style="margin: 0 0 22px 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1;">
                <strong>${inviterDisplay}</strong> has invited you to join the private <strong>CEOVA Team Portal</strong>. You have been granted workspace access to collaborate with the team, track initiatives, and access portal tools.
              </p>

              <!-- Assignment Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090d16; border: 1px solid #1e293b; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #1e293b;">
                    <div style="font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Invited Email</div>
                    <div style="font-size: 13.5px; font-weight: 600; color: #ffffff; margin-top: 3px;">${params.email}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #1e293b;">
                    <div style="font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Assigned Role</div>
                    <div style="font-size: 13.5px; font-weight: 700; color: #38bdf8; margin-top: 3px;">${roleDisplay}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px;">
                    <div style="font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Department</div>
                    <div style="font-size: 13.5px; font-weight: 600; color: #e2e8f0; margin-top: 3px;">${departmentDisplay}</div>
                  </td>
                </tr>
              </table>

              <!-- Steps Guide -->
              <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 12px;">
                How to activate your account:
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 26px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-bottom: 12px;">
                    <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; background-color: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; text-align: center; font-size: 11px; font-weight: 700;">1</span>
                  </td>
                  <td style="padding-bottom: 12px; font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
                    Click the <strong>Accept Invitation &amp; Join Workspace</strong> button below.
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-bottom: 12px;">
                    <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; background-color: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; text-align: center; font-size: 11px; font-weight: 700;">2</span>
                  </td>
                  <td style="padding-bottom: 12px; font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
                    Enter your email (<strong>${params.email}</strong>) and set your personal password.
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; width: 28px;">
                    <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; background-color: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; text-align: center; font-size: 11px; font-weight: 700;">3</span>
                  </td>
                  <td style="font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
                    Confirm your email, log in, and complete your quick profile setup.
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 14px 22px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14.5px; font-weight: 700; border-radius: 8px; letter-spacing: 0.01em;">
                      Accept Invitation &amp; Join Workspace &rarr;
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
            <td style="padding: 18px 34px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
                This invitation was sent directly to <strong>${params.email}</strong> by CEOVA Administration.
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
</html>
`.trim();
}

/**
 * Sends a high-impact, professional workspace invitation email
 */
export const sendInvitationEmail = async (
  payload: SendInvitationPayload
): Promise<{ success: boolean; error?: string }> => {
  const cleanEmail = payload.to.trim().toLowerCase();
  const subject = `You're invited to join CEOVA Portal (${(payload.role || 'Member').toUpperCase()})`;
  
  const htmlContent = generateInvitationHtml({
    email: cleanEmail,
    role: payload.role,
    department: payload.department,
    inviterName: payload.inviterName || 'CEOVA Administration',
  });

  const textContent = `You have been invited to join the CEOVA Team Portal as ${payload.role || 'Member'}.\n\nTo activate your account:\n1. Visit https://portal.ceovaai.com\n2. Enter your email (${cleanEmail}) and choose your password\n3. Click the confirmation link in your email and finish your profile setup.\n\nCEOVA Enterprise Team OS`;

  return sendNotificationEmail({
    to: cleanEmail,
    subject,
    title: 'Workspace Invitation',
    message: textContent,
    html: htmlContent,
    text: textContent,
  });
};

/**
 * Generates an executive-grade, responsive HTML notification email
 */
export function generateNotificationHtml(params: {
  title?: string;
  message: string;
  subject?: string;
  badge?: string;
  actionUrl?: string;
  actionText?: string;
}): string {
  const portalUrl = params.actionUrl || 'https://portal.ceovaai.com';
  const actionText = params.actionText || 'Open Ceova Dashboard';
  const badgeText = (params.badge || 'Workspace Alert').toUpperCase();
  const headingTitle = params.title || params.subject || 'New Workspace Notification';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headingTitle}</title>
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
                      ${badgeText}
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
                ${headingTitle}
              </h1>
              <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                You have received a new notification in your CEOVA workspace:
              </p>

              <!-- Message Callout Box -->
              <div style="background-color: #090d16; border: 1px solid #1e293b; border-left: 4px solid #2563eb; border-radius: 10px; padding: 18px 20px; margin-bottom: 26px;">
                ${params.title && params.title !== headingTitle ? `<div style="font-size: 14px; font-weight: 700; color: #38bdf8; margin-bottom: 8px;">${params.title}</div>` : ''}
                <div style="font-size: 14px; color: #f1f5f9; line-height: 1.65; white-space: pre-wrap;">${params.message}</div>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 14px 22px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14.5px; font-weight: 700; border-radius: 8px; letter-spacing: 0.01em;">
                      ${actionText} &rarr;
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
</html>
`.trim();
}

/**
 * Sends notification or workspace email via SMTP or Edge Function.
 */
export const sendNotificationEmail = async (
  payload: SendEmailPayload
): Promise<{ success: boolean; error?: string }> => {
  const apiKey = getResendApiKey();
  const smtpPass = getSmtpPassword();
  const toList = Array.isArray(payload.to)
    ? payload.to.filter(Boolean)
    : [payload.to].filter(Boolean);

  if (toList.length === 0) {
    return { success: false, error: 'No recipient emails found' };
  }

  const subject = payload.subject || (payload.title ? `[CEOVA] ${payload.title}` : 'CEOVA Workspace Notification');
  const notificationBody = payload.message || payload.title || 'New update in Ceova Portal';
  const actionUrl = payload.actionUrl || 'https://portal.ceovaai.com';
  const actionText = payload.actionText || 'View in Dashboard';
  const badge = payload.badge || 'Workspace Alert';

  const textContent = payload.text || `CEOVA Workspace Notification\n\n${payload.title ? `${payload.title}\n------------------------\n` : ''}${notificationBody}\n\nView in your dashboard: ${actionUrl}\n\nCEOVA Enterprise Team OS`;

  const htmlContent = payload.html || generateNotificationHtml({
    title: payload.title,
    message: notificationBody,
    subject,
    badge,
    actionUrl,
    actionText,
  });

  // 1. Invoke Supabase Edge Function with SMTP credentials and content
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: toList,
          recipient_emails: toList,
          target_type: 'custom',
          subject,
          title: payload.title,
          message: notificationBody,
          html: htmlContent,
          text: textContent,
          smtpPass,
          smtpUser: 'ceova.ai@gmail.com',
          apiKey
        }
      });
      if (!error && data?.success) {
        console.log('[Email Dispatch] Successfully sent to:', toList, data);
        return { success: true };
      }
      if (data?.error) {
        console.warn('[Email Dispatch] Edge Function notice:', data.error);
      }
    } catch (edgeErr) {
      console.warn('[Email Dispatch] Edge function invoke error:', edgeErr);
    }
  }

  // 2. Fallback to direct Resend if API key is provided and Edge Function is unreachable
  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Ceova Portal <onboarding@resend.dev>',
          to: toList,
          subject,
          text: textContent,
          html: htmlContent
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: `Delivery error: ${JSON.stringify(errJson)}` };
      }

      return { success: true };
    } catch (directErr: any) {
      return { success: false, error: directErr.message || 'Direct network error' };
    }
  }

  return { success: true };
};

/**
 * Backwards compatibility alias
 */
export const sendNotificationEmailViaResend = sendNotificationEmail;

/**
 * Automatically resolves target user emails and sends notification email via Resend
 */
export const dispatchNotificationEmails = async (
  notification: AppNotification,
  explicitEmails?: string[]
) => {
  try {
    let targetEmails: string[] = [];

    if (explicitEmails && explicitEmails.length > 0) {
      targetEmails = explicitEmails;
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        if (notification.target_type === 'all' || notification.user_id === 'all') {
          const { data } = await supabase
            .from('profiles')
            .select('email')
            .not('email', 'is', null);
          if (data) {
            targetEmails = data.map(d => d.email).filter(Boolean);
          }
        } else if (notification.recipient_ids && notification.recipient_ids.length > 0) {
          const { data } = await supabase
            .from('profiles')
            .select('email')
            .in('id', notification.recipient_ids);
          if (data) {
            targetEmails = data.map(d => d.email).filter(Boolean);
          }
        } else if (notification.user_id) {
          const { data } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', notification.user_id)
            .maybeSingle();
          if (data?.email) {
            targetEmails = [data.email];
          }
        }
      }
    }

    // Fallback to cached members in localStorage
    if (targetEmails.length === 0) {
      try {
        const rawMembers = localStorage.getItem('ceova_portal_members');
        if (rawMembers) {
          const members: Profile[] = JSON.parse(rawMembers);
          if (notification.target_type === 'all' || notification.user_id === 'all') {
            targetEmails = members.map(m => m.email).filter(Boolean);
          } else if (notification.recipient_ids && notification.recipient_ids.length > 0) {
            targetEmails = members
              .filter(m => notification.recipient_ids?.includes(m.id))
              .map(m => m.email)
              .filter(Boolean);
          } else if (notification.user_id) {
            const found = members.find(m => m.id === notification.user_id);
            if (found?.email) targetEmails = [found.email];
          }
        }
      } catch {}
    }

    // Filter valid unique emails
    const uniqueEmails = Array.from(new Set(targetEmails.filter(e => e && e.includes('@'))));
    if (uniqueEmails.length === 0) {
      console.log('[Resend Email] No recipient email addresses resolved for notification:', notification.id);
      return;
    }

    const subject = notification.title
      ? `[CEOVA] ${notification.title}`
      : 'CEOVA Workspace Notification';

    await sendNotificationEmailViaResend({
      to: uniqueEmails,
      subject,
      title: notification.title,
      message: notification.message,
      badge: notification.target_type === 'all' ? 'Announcement' : 'Workspace Alert',
      actionUrl: 'https://portal.ceovaai.com',
      actionText: 'View in Dashboard',
    });
  } catch (err) {
    console.error('[Resend Email] Unexpected error dispatching notification email:', err);
  }
};
