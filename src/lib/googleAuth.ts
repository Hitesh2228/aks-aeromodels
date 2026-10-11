// Google Authentication & User Profile Management for SKYNODES UAV

export const DEFAULT_GOOGLE_CLIENT_ID = '549359041312-a6tjfkn7c8s5054alr1dc213gv91hift.apps.googleusercontent.com';

export interface GoogleUserProfile {
  id?: string;
  name: string;
  email: string;
  picture?: string;
  phone?: string;
}

// Configurable Client ID from environment, storage, or default
export function getGoogleClientId(): string {
  if (typeof window === 'undefined') return DEFAULT_GOOGLE_CLIENT_ID;
  return (
    (import.meta as any).env?.PUBLIC_GOOGLE_CLIENT_ID ||
    localStorage.getItem('skynodes_google_client_id') ||
    DEFAULT_GOOGLE_CLIENT_ID
  );
}

export function setGoogleClientId(clientId: string): void {
  if (typeof window !== 'undefined' && clientId) {
    localStorage.setItem('skynodes_google_client_id', clientId.trim());
  }
}

// Dynamically load Google Identity Services script
export function loadGoogleGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if ((window as any).google?.accounts?.oauth2 || (window as any).google?.accounts?.id) {
      return resolve();
    }
    const existing = document.getElementById('google-gsi-client-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

// Trigger Google Sign-In with real account
export async function triggerGoogleSignIn(
  onSuccess: (user: GoogleUserProfile) => void,
  onError?: (err: any) => void
): Promise<void> {
  try {
    const clientId = getGoogleClientId();

    if (!clientId) {
      onError?.({ error: 'Google Client ID not configured.' });
      return;
    }

    await loadGoogleGsiScript();
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      throw new Error('Google Identity Services failed to load.');
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile openid',
      prompt: 'select_account',
      error_callback: (nonOAuthErr: any) => {
        console.warn('[Google Identity Error]', nonOAuthErr);
        onError?.(nonOAuthErr);
      },
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          console.warn('[Google OAuth Error]', tokenResponse);
          onError?.(tokenResponse);
          return;
        }

        if (tokenResponse.access_token) {
          try {
            // Fetch real user profile from Google OAuth2 API
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            const info = await res.json();
            const user: GoogleUserProfile = {
              id: info.sub,
              name: info.name || info.email?.split('@')[0] || 'Pilot',
              email: info.email,
              picture: info.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(info.name || 'Pilot')}&background=111111&color=ffffff&size=200`
            };

            saveLoggedInUser(user);
            onSuccess(user);
          } catch (fetchErr) {
            console.error('[Google UserInfo Fetch Error]', fetchErr);
            onError?.(fetchErr);
          }
        }
      }
    });

    tokenClient.requestAccessToken();
  } catch (err) {
    console.error('[Google Sign-In Trigger Exception]', err);
    onError?.(err);
  }
}


export function saveLoggedInUser(user: GoogleUserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('google_auth_logged_in', 'true');
  localStorage.setItem('skynodes_pilot_name', user.name);
  localStorage.setItem('skynodes_pilot_email', user.email);
  if (user.picture) {
    localStorage.setItem('skynodes_pilot_avatar', user.picture);
  }
  if (user.phone) {
    localStorage.setItem('skynodes_pilot_phone', user.phone);
  }

  // Auto-sync customer to Shopify Admin Customers in background
  try {
    if (user.email || user.phone) {
      fetch('/api/sync-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone
        })
      }).catch(err => console.warn('[Shopify Customer Sync Warning]', err));
    }
  } catch (err) {}

  window.dispatchEvent(new CustomEvent('user-logged-in', { detail: user }));
}

export function getLoggedInUser(): GoogleUserProfile | null {
  if (typeof window === 'undefined') return null;
  const isLoggedIn = localStorage.getItem('google_auth_logged_in') === 'true';
  if (!isLoggedIn) return null;

  const name = localStorage.getItem('skynodes_pilot_name') || 'Pilot';
  const email = localStorage.getItem('skynodes_pilot_email') || '';
  const avatar = localStorage.getItem('skynodes_pilot_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111111&color=ffffff&size=200`;

  return {
    name,
    email,
    picture: avatar,
    phone: localStorage.getItem('skynodes_pilot_phone') || ''
  };
}

export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('google_auth_logged_in');
  localStorage.removeItem('skynodes_pilot_name');
  localStorage.removeItem('skynodes_pilot_email');
  localStorage.removeItem('skynodes_pilot_avatar');
  localStorage.removeItem('skynodes_pilot_phone');
  window.dispatchEvent(new CustomEvent('user-logged-in', { detail: null }));
}
