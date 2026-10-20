'use strict';
(() => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduceMotion = () => media.matches || document.body.classList.contains('reduce-motion');
  const storageKey = 'guardiao.navigation.circle.v1';
  const panelAnimations = new WeakMap();
  const CIRCLE_HOLD_MS = 650;
  const FADE_HOLD_MS = 80;
  let navigating = false;
  let finishCover;
  let navigateToDestination;
  let veil;
  let navigationTimer;
  let revealTimer;

  function removeVeil() {
    clearTimeout(navigationTimer);
    clearTimeout(revealTimer);
    veil?.remove(); veil = null;
    navigating = false; finishCover = null; navigateToDestination = null;
    document.body.removeAttribute('aria-busy');
  }
  function clearArrival() {
    try { sessionStorage.removeItem(storageKey); } catch { /* Armazenamento opcional. */ }
  }
  window.addEventListener('pageshow', event => {
    if (event.persisted) { removeVeil(); clearArrival(); }
  });
  function leafBurst(overlay) {
    if (reduceMotion() || overlay.classList.contains('is-fade')) return;
    const count = innerWidth < 651 ? 8 : 14;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const leaf = document.createElement('span');
      leaf.className = 'transition-burst';
      const angle = i / count * Math.PI * 2;
      const distance = 120 + Math.random() * 240;
      const properties = {
        '--burst-x': `${Math.cos(angle) * distance}px`,
        '--burst-y': `${Math.sin(angle) * distance * .65}px`,
        '--burst-turn': `${Math.random() * 260 - 130}deg`,
        '--burst-size': `${18 + Math.random() * 16}px`,
        '--sprite-x': `${i % 4 * 100 / 3}%`,
        '--sprite-y': `${Math.floor(i % 8 / 4) * 100}%`
      };
      for (const [name, value] of Object.entries(properties)) leaf.style.setProperty(name, value);
      fragment.append(leaf);
    }
    overlay.append(fragment);
  }
  function makeVeil(x, y) {
    const overlay = document.createElement('div');
    overlay.className = 'navigation-veil'; overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.toggle('is-fade', reduceMotion());
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 8;
    overlay.style.setProperty('--origin-x', `${x}px`);
    overlay.style.setProperty('--origin-y', `${y}px`);
    overlay.style.setProperty('--cover-size', `${radius * 2}px`);
    const circle = document.createElement('div'); circle.className = 'transition-circle';
    overlay.append(circle);
    document.body.append(overlay);
    return overlay;
  }
  function animateScreen() {
    if (reduceMotion()) return;
    document.body.classList.add('screen-entering');
    setTimeout(() => document.body.classList.remove('screen-entering'), 550);
  }

  let arriving;
  try { arriving = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { arriving = null; }
  clearArrival();
  if (arriving?.path === location.pathname && Number.isFinite(arriving.at) && Date.now() - arriving.at < 15000) {
    const x = Number.isFinite(arriving.x) ? Math.max(0, Math.min(1, arriving.x)) * innerWidth : innerWidth / 2;
    const y = Number.isFinite(arriving.y) ? Math.max(0, Math.min(1, arriving.y)) * innerHeight : innerHeight / 2;
    veil = makeVeil(x, y);
    veil.classList.add('is-covered');
    const arrivalVeil = veil;
    document.body.setAttribute('aria-busy', 'true');
    let revealed = false;
    const reveal = () => {
      if (revealed || veil !== arrivalVeil) return;
      revealed = true;
      clearTimeout(revealTimer);
      // Dois frames garantem que o círculo coberto apareça antes da abertura.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (veil !== arrivalVeil) return;
        if (!arrivalVeil.classList.contains('is-fade')) animateScreen();
        leafBurst(arrivalVeil);
        arrivalVeil.classList.add('is-revealing');
        const circle = arrivalVeil.querySelector('.transition-circle');
        arrivalVeil.addEventListener('animationend', event => {
          if ((event.target === circle && event.animationName === 'circle-reveal') ||
              (event.target === arrivalVeil && event.animationName === 'veil-fade-out')) removeVeil();
        });
        navigationTimer = setTimeout(removeVeil, arrivalVeil.classList.contains('is-fade') ? 450 : 800);
      }));
    };
    if (document.readyState === 'complete') reveal();
    else window.addEventListener('load', reveal, { once: true });
    // Imagens lentas não podem manter a interface bloqueada indefinidamente.
    revealTimer = setTimeout(reveal, 1000);
  } else animateScreen();

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || !['http:', 'https:', 'file:'].includes(destination.protocol)) return;
    if (destination.pathname === location.pathname && destination.search === location.search) return;
    event.preventDefault();
    if (navigating) return;
    removeVeil(); navigating = true;
    const rect = link.getBoundingClientRect();
    const x = event.detail > 0 ? Math.max(0, Math.min(innerWidth, event.clientX)) : rect.left + rect.width / 2;
    const y = event.detail > 0 ? Math.max(0, Math.min(innerHeight, event.clientY)) : rect.top + rect.height / 2;
    veil = makeVeil(x, y);
    const departureVeil = veil;
    const circle = veil.querySelector('.transition-circle');
    const message = document.createElement('p'); message.className = 'transition-message';
    message.textContent = destination.pathname.endsWith('/aventura.html') ? 'Entrando na floresta…' : destination.pathname.endsWith('/configuracoes.html') ? 'Abrindo configurações…' : destination.pathname.endsWith('/sobre.html') ? 'Conhecendo a jornada…' : 'Voltando à floresta…';
    veil.append(message); document.body.setAttribute('aria-busy', 'true');
    let assigned = false;
    const navigate = () => {
      if (assigned) return; assigned = true;
      clearTimeout(navigationTimer);
      // Grava perto da troca, para suportar abas suspensas e conexões mais lentas.
      try { sessionStorage.setItem(storageKey, JSON.stringify({ path: destination.pathname, at: Date.now(), x: x / innerWidth, y: y / innerHeight })); } catch { /* A saída também funciona sem armazenamento. */ }
      location.assign(destination.href);
    };
    navigateToDestination = navigate;
    let covered = false;
    finishCover = () => {
      if (covered || veil !== departureVeil) return;
      covered = true;
      clearTimeout(navigationTimer);
      departureVeil.classList.add('is-ready');
      leafBurst(departureVeil);
      navigationTimer = setTimeout(navigate, departureVeil.classList.contains('is-fade') ? FADE_HOLD_MS : CIRCLE_HOLD_MS);
    };
    departureVeil.addEventListener('animationend', event => {
      if ((event.target === circle && event.animationName === 'circle-cover') ||
          (event.target === departureVeil && event.animationName === 'veil-fade-in')) finishCover?.();
    });
    // Keyframes de transform funcionam sem clip-path e não dependem de um estilo
    // inicial já pintado. O temporizador preserva os links se o CSS falhar.
    veil.classList.add('is-covering');
    navigationTimer = setTimeout(navigate, departureVeil.classList.contains('is-fade') ? 550 : 1700);
  });

  function animateTab() {
    if (reduceMotion()) return;
    const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
    if (!panel?.animate) return;
    panelAnimations.get(panel)?.cancel();
    panelAnimations.set(panel, panel.animate([
      { opacity: 0, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 300, easing: 'cubic-bezier(.2,.7,.3,1)' }));
  }
  document.addEventListener('click', event => { if (event.target.closest('[role="tab"]')) animateTab(); });
  document.addEventListener('keydown', event => {
    if (event.target.matches('[role="tab"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) animateTab();
  });
  function respectReducedMotion() {
    if (!reduceMotion()) return;
    document.body.classList.remove('screen-entering');
    document.querySelectorAll('[role="tabpanel"]').forEach(panel => panelAnimations.get(panel)?.cancel());
    if (!veil || veil.classList.contains('is-fade')) return;
    // Se o sistema pedir menos movimento durante a transição, passa para fade
    // sem abandonar a navegação nem manter folhas/círculo em movimento.
    veil.querySelectorAll('.transition-burst').forEach(leaf => leaf.remove());
    veil.classList.add('is-fade');
    if (navigating) {
      clearTimeout(navigationTimer);
      navigationTimer = veil.classList.contains('is-ready')
        ? setTimeout(navigateToDestination, FADE_HOLD_MS)
        : setTimeout(finishCover, 400);
    } else if (veil.classList.contains('is-revealing')) {
      clearTimeout(navigationTimer);
      navigationTimer = setTimeout(removeVeil, 450);
    }
  }
  media.addEventListener('change', respectReducedMotion);
  document.addEventListener('input', event => { if (event.target.id === 'reduceMotion') respectReducedMotion(); });
})();
