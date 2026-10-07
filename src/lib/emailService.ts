import { getSupabaseClient } from './supabase';
import { AppNotification, Profile } from '../types';

export const RESEND_STORAGE_KEY = 'ceova_resend_api_key';

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
            <td style="padding: 34px 34px 20px; text-align: center; background: radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.18) 0%, rgba(15, 20, 34, 0) 70%);">
              <div style="display: inline-block; width: 56px; height: 56px; margin: 0 auto 14px auto; background: #161c2e; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px; text-align: center; line-height: 56px;">
                <span style="font-size: 24px; font-weight: 800; color: #38bdf8; font-family: monospace;">◈</span>
              </div>
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 2.5px; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">
                OFFICIAL WORKSPACE INVITATION
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                You're invited to join CEOVA
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 10px 34px 30px;">
              <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1;">
                Hello,
              </p>
              <p style="margin: 0 0 22px 0; font-size: 14.5px; line-height: 1.6; color: #cbd5e1;">
                <strong>${inviterDisplay}</strong> has invited you to join the private <strong>CEOVA Team Portal</strong>. You have been granted workspace access to collaborate with the team, track initiatives, and access portal tools.
              </p>

              <!-- Assignment Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255, 255, 255, 0.035); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                    <div style="font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Invited Email</div>
                    <div style="font-size: 13.5px; font-weight: 600; color: #ffffff; margin-top: 3px;">${params.email}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
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
                  <td style="vertical-align: top; width: 26px; padding-bottom: 12px;">
                    <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-radius: 50%; text-align: center; font-size: 11px; font-weight: 700;">1</span>
                  </td>
                  <td style="padding-bottom: 12px; font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
                    Click the <strong>Accept Invitation &amp; Join Workspace</strong> button below.
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; width: 26px; padding-bottom: 12px;">
                    <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-radius: 50%; text-align: center; font-size: 11px; font-weight: 700;">2</span>
                  </td>
                  <td style="padding-bottom: 12px; font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
                    Enter your email (<strong>${params.email}</strong>) and set your personal password.
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; width: 26px;">
                    <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-radius: 50%; text-align: center; font-size: 11px; font-weight: 700;">3</span>
                  </td>
                  <td style="font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
                    Click the instant email confirmation link, log in, and complete your quick profile setup.
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 14px 22px; background: #2563eb; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 14.5px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.45); letter-spacing: 0.01em;">
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
            <td style="padding: 18px 34px; background: #0a0d16; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
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

  return sendNotificationEmailViaResend({
    to: cleanEmail,
    subject,
    title: 'Workspace Invitation',
    message: textContent,
    html: htmlContent,
    text: textContent,
  });
};

/**
 * Sends notification email via Resend API.
 */
export const sendNotificationEmailViaResend = async (
  payload: SendEmailPayload
): Promise<{ success: boolean; error?: string }> => {
  const apiKey = getResendApiKey();
  const toList = Array.isArray(payload.to)
    ? payload.to.filter(Boolean)
    : [payload.to].filter(Boolean);

  if (toList.length === 0) {
    return { success: false, error: 'No recipient emails found' };
  }

  const subject = payload.subject || 'you have notification from ceova portal';
  const notificationBody = payload.message || payload.title || 'New update in Ceova Portal';

  const textContent = payload.text || `this notification is given to u because you have a notification in your dashboad check it there to and hers the message \n\n${notificationBody}`;

  const htmlContent = payload.html || `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
  <div style="max-width: 560px; margin: 0 auto; background: #141416; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div style="padding: 22px 26px; background: linear-gradient(135deg, #18181b 0%, #09090b 100%); border-bottom: 1px solid #27272a;">
      <span style="font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: #a1a1aa; font-weight: 700;">CEOVA PORTAL</span>
      <h2 style="margin: 6px 0 0 0; font-size: 18px; color: #ffffff; font-weight: 700;">${subject}</h2>
    </div>
    <div style="padding: 24px 26px;">
      <p style="margin: 0 0 16px 0; font-size: 13.5px; line-height: 1.55; color: #d4d4d8;">
        this notification is given to u because you have a notification in your dashboad check it there to and hers the message
      </p>
      <div style="background: #09090b; border: 1px solid #27272a; border-left: 3px solid #60a5fa; border-radius: 6px; padding: 14px 16px; margin: 16px 0;">
        ${payload.title ? `<div style="font-size: 13.5px; font-weight: 700; color: #ffffff; margin-bottom: 6px;">${payload.title}</div>` : ''}
        <div style="font-size: 12.5px; color: #a1a1aa; line-height: 1.5; white-space: pre-wrap;">${notificationBody}</div>
      </div>
      <p style="margin: 20px 0 0 0; font-size: 11.5px; color: #71717a;">
        Please log into your Ceova dashboard to view details and attachments.
      </p>
    </div>
    <div style="padding: 14px 26px; background: #0c0c0e; border-top: 1px solid #27272a; text-align: center; font-size: 10.5px; color: #52525b;">
      Ceova Portal Notification System &bull; RESEND_API Delivery
    </div>
  </div>
</body>
</html>`.trim();

  // 1. Try Supabase Edge Function first (bypasses browser CORS restrictions completely)
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
          apiKey
        }
      });
      if (!error && data?.success) {
        if (data.sent_count === 0 && data.results?.[0]?.response?.message) {
          console.warn('[Resend Email] Provider response warning:', data.results[0].response.message);
          return { success: false, error: data.results[0].response.message };
        }
        console.log('[Resend Email] Successfully delivered via Supabase Edge Function to:', toList, data);
        return { success: true };
      }
    } catch (edgeErr) {
      console.warn('[Resend Email] Edge function invoke error, falling back to direct Resend call:', edgeErr);
    }
  }

  // 2. Fallback: Direct Resend API call if apiKey is present
  if (!apiKey) {
    console.warn('[Resend Email] RESEND_API key is not configured. Email notification skipped.');
    return { success: false, error: 'RESEND_API key not configured' };
  }

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
      console.error('[Resend Email] Direct API error response:', res.status, errJson);
      return { success: false, error: `Resend HTTP ${res.status}: ${JSON.stringify(errJson)}` };
    }

    console.log('[Resend Email] Successfully sent directly via Resend API to:', toList);
    return { success: true };
  } catch (directErr: any) {
    console.error('[Resend Email] Direct fetch failed:', directErr);
    return { success: false, error: directErr.message || 'Direct network error' };
  }
};

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

    await sendNotificationEmailViaResend({
      to: uniqueEmails,
      subject: 'you have notification from ceova portal',
      title: notification.title,
      message: notification.message
    });
  } catch (err) {
    console.error('[Resend Email] Unexpected error dispatching notification email:', err);
  }
};
