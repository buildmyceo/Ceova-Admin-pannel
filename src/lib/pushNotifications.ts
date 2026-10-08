// In-App and Push Notification Management for Android, iOS, and Web
import { AppNotification } from '../types';

let deferredInstallPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('ceova_pwa_installable', { detail: true }));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    window.dispatchEvent(new CustomEvent('ceova_pwa_installed'));
  });
}

// Check if app is running as installed standalone PWA
export const isStandaloneApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Check platform
export const getMobilePlatform = (): 'ios' | 'android' | 'desktop' => {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
};

// Trigger Android / Desktop 1-Click PWA Install Prompt
export const triggerPwaInstall = async (): Promise<boolean> => {
  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        deferredInstallPrompt = null;
        return true;
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  }
  return false;
};

// Notification Permission Status
export const getNotificationPermission = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
};

// Request Notification Permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return false;
  }
};

// Synthesize pleasant in-app notification audio chime using Web Audio API
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Smooth dual-tone chime (F#5 to B5)
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(739.99, now); // F#5
    osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.15); // B5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(369.99, now);
    osc2.frequency.exponentialRampToValueAtTime(493.88, now + 0.15);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch (_) {
    // Ignore audio autoplay restrictions if user hasn't interacted yet
  }
};

// Dispatch both In-App Banner & Native Push Notification
export const dispatchInAppNotification = (title: string, message: string, options?: { avatar?: string; url?: string }) => {
  // 1. Play in-app audio chime
  playNotificationChime();

  // 2. Fire In-App Toast Banner Event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ceova_inapp_notification', {
        detail: {
          id: 'toast_' + Date.now(),
          title,
          message,
          avatar: options?.avatar,
          url: options?.url,
          timestamp: new Date().toISOString()
        }
      })
    );
  }

  // 3. Fire Native Device Notification if permission granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          message,
          url: options?.url
        });
      } else {
        new Notification(title, {
          body: message,
          icon: options?.avatar || '/ceovaimage.png',
          badge: '/ceovaimage.png'
        });
      }
    } catch (_) {}
  }
};
