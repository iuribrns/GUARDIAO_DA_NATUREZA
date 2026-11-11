'use strict';
(() => {
  const layer = document.querySelector('.falling-leaves');
  const scene = document.querySelector('.scene');
  const smallScreen = window.matchMedia('(max-width: 760px)');
  function createLeaves() {
    const count = smallScreen.matches ? 18 : 30;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const leaf = document.createElement('span');
      leaf.className = 'falling-leaf';
      const face = document.createElement('span');
      face.className = 'leaf-face';
      const sprite = i % 8;
      const duration = 10 + Math.random() * 8;
      const near = i % 3 === 0;
      leaf.style.left = `${(i + Math.random()) / count * 100}%`;
      const properties = {
        '--leaf-size': `${near ? 65 + Math.random() * 25 : 38 + Math.random() * 23}px`,
        '--fall-time': `${duration}s`,
        '--phase': `${-(i + 0.5) / count * duration}s`,
        '--sprite-x': `${sprite % 4 * 100 / 3}%`,
        '--sprite-y': `${Math.floor(sprite / 4) * 100}%`,
        '--leaf-drift': `${-100 + Math.random() * 240}px`,
        '--leaf-sway': `${18 + Math.random() * 28}px`,
        '--leaf-angle': `${Math.random() * 300}deg`,
        '--flutter-time': `${2 + Math.random() * 2}s`,
        '--leaf-opacity': near ? '0.95' : '0.78'
      };
      for (const [name, value] of Object.entries(properties)) leaf.style.setProperty(name, value);
      leaf.append(face);
      fragment.append(leaf);
    }
    layer.replaceChildren(fragment);
    resizeFall();
  }
  function resizeFall() {
    // Mede a cena, que mantém sua altura mesmo com as animações desligadas.
    layer.style.setProperty('--leaf-fall-distance', `${scene.clientHeight + 180}px`);
  }
  function pauseWhenHidden() {
    document.body.classList.toggle('page-hidden', document.hidden);
  }
  createLeaves();
  smallScreen.addEventListener('change', createLeaves);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resizeFall).observe(scene);
  else window.addEventListener('resize', resizeFall);
  document.addEventListener('visibilitychange', pauseWhenHidden);
  pauseWhenHidden();
})();
