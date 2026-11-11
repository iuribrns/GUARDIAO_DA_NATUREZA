'use strict';
(() => {
  // A arte substitui apenas a aparência: links, rótulos e áreas de toque continuam HTML.
  document.querySelectorAll('.claude-card-art').forEach(image => {
    const update = () => image.closest('a').classList.toggle('claude-skin-ready', image.complete && image.naturalWidth > 0);
    image.addEventListener('load', update);
    image.addEventListener('error', update);
    update();
  });
  const atmosphere = document.createElement('div');
  atmosphere.className = 'atmosphere'; atmosphere.setAttribute('aria-hidden', 'true');
  const ray = document.createElement('div'); ray.className = 'forest-light'; atmosphere.append(ray);
  const compact = window.matchMedia('(max-width: 650px)');
  function fillGlows() {
    atmosphere.querySelectorAll('.forest-glow').forEach(glow => glow.remove());
    const fragment = document.createDocumentFragment();
    const count = compact.matches ? 6 : 12;
    for (let i = 0; i < count; i++) {
      const glow = document.createElement('span'); glow.className = 'forest-glow';
      glow.style.left = `${Math.random() * 100}%`;
      glow.style.top = `${40 + Math.random() * 55}%`;
      glow.style.setProperty('--glow-size', `${3 + Math.random() * 3}px`);
      glow.style.setProperty('--glow-time', `${6 + Math.random() * 5}s`);
      glow.style.setProperty('--glow-delay', `${-Math.random() * 10}s`);
      fragment.append(glow);
    }
    atmosphere.append(fragment);
  }
  document.body.prepend(atmosphere);
  fillGlows(); compact.addEventListener('change', fillGlows);
})();
