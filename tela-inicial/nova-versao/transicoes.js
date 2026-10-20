'use strict';
(() => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduceMotion = () => media.matches || document.body.classList.contains('reduce-motion');
  const storageKey = 'guardiao.navigation.circle.v1';
  const canWipe = window.CSS?.supports?.('clip-path', 'circle(0px at 50% 50%)');
  let navigating = false;
  let navigationTimer;
  let activeDestination;
  let veil;
  const panelAnimations = new WeakMap();
  function removeVeil() {
    window.clearTimeout(navigationTimer);
    veil?.remove(); veil = null;
    navigating = false;
    document.body.removeAttribute('aria-busy');
  }
  window.addEventListener('pageshow', event => { if (event.persisted) removeVeil(); });
  function makeVeil(x, y) {
    const overlay = document.createElement('div');
    overlay.className = 'navigation-veil'; overlay.setAttribute('aria-hidden', 'true');
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 8;
    overlay.style.setProperty('--origin-x', `${x}px`);
    overlay.style.setProperty('--origin-y', `${y}px`);
    overlay.style.setProperty('--cover-radius', `${radius}px`);
    document.body.append(overlay); return overlay;
  }
  // Uma navegação iniciada aqui leva apenas metadados não secretos para a próxima tela.
  let arriving;
  try {
    arriving = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    sessionStorage.removeItem(storageKey);
  } catch { arriving = null; }
  if (arriving?.path === window.location.pathname && Number.isFinite(arriving.at) && Date.now() - arriving.at < 10000 && !reduceMotion()) {
    veil = makeVeil(innerWidth / 2, innerHeight / 2);
    veil.classList.add('is-covered');
    const arrivalVeil = veil;
    document.body.setAttribute('aria-busy', 'true');
    let revealed = false;
    const reveal = () => {
      if (revealed || veil !== arrivalVeil) return; revealed = true;
      requestAnimationFrame(() => {
        if (veil !== arrivalVeil) return;
        window.clearTimeout(navigationTimer);
        veil?.classList.add('is-revealing');
        navigationTimer = window.setTimeout(removeVeil, 260);
      });
    };
    if (document.readyState === 'complete') reveal();
    else window.addEventListener('load', reveal, { once: true });
    navigationTimer = window.setTimeout(reveal, 1400);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || !['http:', 'https:', 'file:'].includes(destination.protocol)) return;
    if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
    if (reduceMotion() || !canWipe) return;
    event.preventDefault();
    if (navigating) return;
    removeVeil(); navigating = true; activeDestination = destination;
    const rect = link.getBoundingClientRect();
    const x = event.detail > 0 ? Math.max(0, Math.min(innerWidth, event.clientX)) : rect.left + rect.width / 2;
    const y = event.detail > 0 ? Math.max(0, Math.min(innerHeight, event.clientY)) : rect.top + rect.height / 2;
    veil = makeVeil(x, y);
    const message = document.createElement('p'); message.className = 'transition-message';
    message.textContent = destination.pathname.endsWith('/aventura.html') ? 'Entrando na floresta…' : destination.pathname.endsWith('/configuracoes.html') ? 'Abrindo configurações…' : destination.pathname.endsWith('/sobre.html') ? 'Conhecendo a jornada…' : 'Voltando à floresta…';
    veil.append(message); document.body.setAttribute('aria-busy', 'true');
    try { sessionStorage.setItem(storageKey, JSON.stringify({ path: destination.pathname, at: Date.now() })); } catch { /* A navegação funciona também sem armazenamento. */ }
    let assigned = false;
    const navigate = () => { if (assigned) return; assigned = true; window.clearTimeout(navigationTimer); window.location.assign(destination.href); };
    let covered = false;
    veil.addEventListener('transitionend', event => {
      if (event.target !== veil || event.propertyName !== 'clip-path' || covered) return;
      covered = true;
      window.clearTimeout(navigationTimer);
      veil.classList.add('is-ready');
      navigationTimer = window.setTimeout(navigate, 120);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => veil?.classList.add('is-covering')));
    // Garante a navegação se o navegador interromper a animação ou o CSS não carregar.
    navigationTimer = window.setTimeout(navigate, 900);
  });
  function animateTab() {
    if (reduceMotion()) return;
    const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
    if (!panel?.animate) return;
    panelAnimations.get(panel)?.cancel();
    panelAnimations.set(panel, panel.animate([
      { opacity: 0, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 250, easing: 'cubic-bezier(.2,.7,.3,1)' }));
  }
  document.addEventListener('click', event => { if (event.target.closest('[role="tab"]')) animateTab(); });
  document.addEventListener('keydown', event => {
    if (event.target.matches('[role="tab"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) animateTab();
  });
  function respectReducedMotion() {
    if (!reduceMotion()) return;
    document.querySelectorAll('[role="tabpanel"]').forEach(panel => panelAnimations.get(panel)?.cancel());
    if (navigating && activeDestination) { window.clearTimeout(navigationTimer); window.location.assign(activeDestination.href); }
    else removeVeil();
  }
  media.addEventListener('change', respectReducedMotion);
  document.addEventListener('input', event => { if (event.target.id === 'reduceMotion') respectReducedMotion(); });
})();
