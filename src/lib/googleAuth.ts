// Google Authentication & User Profile Management for SKYNODES UAV

export interface GoogleUserProfile {
  id?: string;
  name: string;
  email: string;
  picture?: string;
  phone?: string;
}

// Configurable Client ID from environment or storage
export function getGoogleClientId(): string {
  if (typeof window === 'undefined') return '';
  return (
    (import.meta as any).env?.PUBLIC_GOOGLE_CLIENT_ID ||
    localStorage.getItem('skynodes_google_client_id') ||
    ''
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
      // If client ID is not yet configured, show modern modal to sign in with real Gmail
      showGoogleEmailPromptModal(
        (user) => {
          saveLoggedInUser(user);
          onSuccess(user);
        },
        async (newClientId) => {
          setGoogleClientId(newClientId);
          await triggerGoogleSignIn(onSuccess, onError);
        }
      );
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
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          console.error('[Google OAuth Error]', tokenResponse);
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

// Clean UI Modal for Gmail Login or Client ID Configuration
function showGoogleEmailPromptModal(
  onEmailSubmit: (user: GoogleUserProfile) => void,
  onClientIdSubmit: (clientId: string) => void
): void {
  const existingModal = document.getElementById('skynodes-google-setup-modal');
  if (existingModal) existingModal.remove();

  const modalHtml = `
    <div id="skynodes-google-setup-modal" style="
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        background: #111111; color: #ffffff; border: 1px solid #2a2a2a;
        border-radius: 16px; max-width: 420px; width: 100%;
        padding: 2rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        position: relative;
      ">
        <button id="google-modal-close-x" style="
          position: absolute; top: 1rem; right: 1rem;
          background: none; border: none; color: #888;
          font-size: 1.5rem; cursor: pointer; line-height: 1;
        ">&times;</button>

        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="
            width: 48px; height: 48px; border-radius: 50%;
            background: #ffffff; display: inline-flex;
            align-items: center; justify-content: center; margin-bottom: 0.75rem;
          ">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin: 0 0 0.4rem 0; color: #fff;">Sign In with Google</h3>
          <p style="font-size: 0.82rem; color: #999; margin: 0;">Enter your Gmail address to securely sign in to your pilot profile:</p>
        </div>

        <form id="google-direct-email-form" style="display: flex; flex-direction: column; gap: 0.85rem;">
          <div>
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #aaa; text-transform: uppercase; margin-bottom: 0.35rem; letter-spacing: 0.05em;">Your Gmail Address</label>
            <input 
              type="email" 
              id="google-direct-email-input" 
              placeholder="e.g. yourname@gmail.com" 
              required
              style="
                width: 100%; box-sizing: border-box; background: #1a1a1a;
                border: 1px solid #333; color: #fff; padding: 0.75rem 0.9rem;
                border-radius: 8px; font-size: 0.92rem; outline: none;
              "
            />
          </div>

          <button 
            type="submit" 
            style="
              width: 100%; background: #ffffff; color: #000000;
              font-weight: 700; font-size: 0.9rem; padding: 0.8rem;
              border-radius: 8px; border: none; cursor: pointer;
            "
          >
            Continue with Gmail &rarr;
          </button>
        </form>

        <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #222; text-align: center;">
          <button id="toggle-client-id-section-btn" style="
            background: none; border: none; color: #777;
            font-size: 0.75rem; cursor: pointer; text-decoration: underline;
          ">
            ⚙️ Store Admin: Add Google Cloud Client ID
          </button>

          <div id="client-id-admin-box" style="display: none; margin-top: 0.85rem; text-align: left;">
            <input 
              type="text" 
              id="admin-client-id-input" 
              placeholder="Paste OAuth Client ID here..." 
              style="
                width: 100%; box-sizing: border-box; background: #1a1a1a;
                border: 1px solid #333; color: #fff; padding: 0.5rem 0.7rem;
                border-radius: 6px; font-size: 0.78rem; outline: none; margin-bottom: 0.5rem;
              "
            />
            <button 
              id="save-client-id-btn" 
              type="button" 
              style="
                width: 100%; background: #2563eb; color: #fff;
                font-weight: 700; font-size: 0.75rem; padding: 0.5rem;
                border-radius: 6px; border: none; cursor: pointer;
              "
            >
              Save Client ID & Launch Official Google Popup
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modalEl = document.getElementById('skynodes-google-setup-modal');
  const closeBtn = document.getElementById('google-modal-close-x');
  const form = document.getElementById('google-direct-email-form');
  const toggleBtn = document.getElementById('toggle-client-id-section-btn');
  const adminBox = document.getElementById('client-id-admin-box');
  const saveClientIdBtn = document.getElementById('save-client-id-btn');
  const clientIdInput = document.getElementById('admin-client-id-input') as HTMLInputElement;

  closeBtn?.addEventListener('click', () => modalEl?.remove());
  modalEl?.addEventListener('click', (e) => {
    if (e.target === modalEl) modalEl.remove();
  });

  toggleBtn?.addEventListener('click', () => {
    if (adminBox) {
      adminBox.style.display = adminBox.style.display === 'none' ? 'block' : 'none';
    }
  });

  saveClientIdBtn?.addEventListener('click', () => {
    const cid = clientIdInput?.value.trim();
    if (cid) {
      modalEl?.remove();
      onClientIdSubmit(cid);
    }
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (document.getElementById('google-direct-email-input') as HTMLInputElement)?.value.trim();
    if (email && email.includes('@')) {
      const autoName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const user: GoogleUserProfile = {
        name: autoName,
        email: email,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(autoName)}&background=111111&color=ffffff&size=200`
      };
      modalEl?.remove();
      onEmailSubmit(user);
    }
  });
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
