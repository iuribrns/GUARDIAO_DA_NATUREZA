'use strict';
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduceMotion = () => prefersReducedMotion.matches || document.body.classList.contains('reduce-motion');
  const nativeTransitions = typeof window.CSSViewTransitionRule === 'function' && window.location.protocol !== 'file:';
  const currentDirectory = new URL('.', window.location.href);
  let leaving = false;
  let entranceAnimation;
  function resetNavigation() {
    leaving = false;
    document.body.classList.remove('screen-leaving');
    document.body.removeAttribute('aria-busy');
  }
  window.addEventListener('pageshow', resetNavigation);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || !['http:', 'https:', 'file:'].includes(destination.protocol)) return;
    if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
    if (reduceMotion()) return;
    // As telas do menu optam pela transição nativa. Outros links internos usam a saída em CSS.
    const nativeDestination = destination.href.startsWith(currentDirectory.href) && /\/(index|configuracoes|sobre|aventura)\.html$/.test(destination.pathname);
    if (nativeTransitions && nativeDestination) return;
    event.preventDefault();
    if (leaving) return;
    leaving = true;
    entranceAnimation?.cancel();
    document.body.setAttribute('aria-busy', 'true');
    document.body.classList.add('screen-leaving');
    // Timeout curto garante navegação mesmo com CSS indisponível ou animação interrompida.
    window.setTimeout(() => window.location.assign(destination.href), 180);
  });
  if (!nativeTransitions && !reduceMotion()) {
    entranceAnimation = document.querySelector('.landing-menu, .wood-panel')?.animate?.([
      { opacity: 0, transform: 'translateY(18px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 260, easing: 'ease-out' });
  }
  const panelAnimations = new WeakMap();
  function animateTab() {
    if (reduceMotion()) return;
    const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
    if (!panel || !panel.animate) return;
    panelAnimations.get(panel)?.cancel();
    panelAnimations.set(panel, panel.animate([
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 240, easing: 'cubic-bezier(.2,.7,.3,1)' }));
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[role="tab"]')) animateTab();
  });
  document.addEventListener('keydown', event => {
    if (event.target.matches('[role="tab"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) animateTab();
  });
  // A escolha de acessibilidade vale também para animações que já estavam em andamento.
  function cancelReducedAnimations() {
    if (!reduceMotion()) return;
    document.querySelectorAll('[role="tabpanel"]').forEach(panel => panelAnimations.get(panel)?.cancel());
  }
  prefersReducedMotion.addEventListener('change', cancelReducedAnimations);
  document.getElementById('reduceMotion')?.addEventListener('input', cancelReducedAnimations);
})();
