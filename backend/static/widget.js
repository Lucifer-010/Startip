/**
 * StarTip - Embeddable Creator Tipping Widget Script
 * Injects a responsive iframe into the creator's target container.
 */
(function() {
  function initStarTip() {
    const currentScript = document.currentScript || (function() {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

    if (!currentScript) return;

    const creator = currentScript.getAttribute('data-creator');
    const targetId = currentScript.getAttribute('data-target') || 'startip-widget';
    const baseUrl = currentScript.src.replace(/\/static\/widget\.js.*$/, '');

    if (!creator) {
      console.error('[StarTip] Missing required attribute data-creator');
      return;
    }

    const container = document.getElementById(targetId);
    if (!container) {
      console.error(`[StarTip] Container element #${targetId} not found.`);
      return;
    }

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}/embed/${encodeURIComponent(creator)}/`;
    iframe.style.width = '100%';
    iframe.style.maxWidth = '380px';
    iframe.style.height = '560px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '20px';
    iframe.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.25)';
    iframe.setAttribute('title', `Tip ${creator} on StarTip`);
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'clipboard-write');

    container.innerHTML = '';
    container.appendChild(iframe);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStarTip);
  } else {
    initStarTip();
  }
})();
