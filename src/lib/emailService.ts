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
}

/**
 * Sends notification email via Resend API.
 * Uses the exact prompt formatting:
 * Subject: you have notification from ceova portal
 * Text: this notification is given to u because you have a notification in your dashboad check it there to and hers the message 
 * {notificatio}
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

  const textContent = `this notification is given to u because you have a notification in your dashboad check it there to and hers the message \n\n${notificationBody}`;

  const htmlContent = `
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
          target_type: 'members',
          subject,
          title: payload.title,
          message: notificationBody,
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
