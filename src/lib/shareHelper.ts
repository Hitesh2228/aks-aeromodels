export function showShareToast(message: string) {
  let toast = document.getElementById('skynodes-share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'skynodes-share-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #111827;
      color: #ffffff;
      padding: 0.65rem 1.25rem;
      border-radius: 9999px;
      font-size: 0.82rem;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 99999;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  setTimeout(() => {
    if (toast) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }
  }, 3000);
}

export function initShareButtons() {
  if (typeof window === 'undefined') return;

  const shareBtns = document.querySelectorAll('.btn-share-product');
  shareBtns.forEach(btn => {
    // Avoid double binding
    if (btn.getAttribute('data-share-bound') === 'true') return;
    btn.setAttribute('data-share-bound', 'true');

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const title = btn.getAttribute('data-title') || document.title || 'SKYNODES UAV Aeromodels';
      const text = btn.getAttribute('data-text') || 'Check out this RC product on SKYNODES UAV!';
      const relUrl = btn.getAttribute('data-url') || window.location.pathname;
      const fullUrl = new URL(relUrl, window.location.origin).href;

      // Native Web Share API (Mobile devices / modern browsers)
      if (navigator.share) {
        try {
          // Pass clean text and url separately so Android/WhatsApp/iOS won't duplicate the URL
          await navigator.share({
            title: title,
            text: text,
            url: fullUrl
          });
          return;
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        }
      }

      // Desktop / Web Fallback: Copy Link to Clipboard + Toast Notice
      try {
        await navigator.clipboard.writeText(fullUrl);
        showShareToast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span>Product link copied to clipboard!</span>');
      } catch (err) {
        const dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = fullUrl;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        showShareToast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span>Product link copied to clipboard!</span>');
      }
    });
  });
}
