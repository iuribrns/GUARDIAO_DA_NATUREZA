'use strict';
(() => {
  const stage = document.querySelector('.map-stage');
  const dialog = document.getElementById('phase-dialog');
  const world = document.createElement('div');
  world.className = 'map-world';
  while (stage.firstChild) world.append(stage.firstChild);
  stage.append(world);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed = () => !reduced.matches && !document.body.classList.contains('reduce-motion') && !document.hidden;
  let zoom = 1, pan = { x: 0, y: 0 }, drag = null, suppressClick = false;
  let selected = null, pose = 0, poseTimer, closeTimer, opener;
  const npcRows = [[0,312],[312,293],[605,299],[904,296],[1200,294],[1494,280]];
  const npcColumns = [0,296,592];
  // Limites reais conferidos na folha: os desenhos não têm espaçamento uniforme.
  const equipmentFrames = [[22,45,332,361],[363,48,356,345],[736,79,348,301],[1084,121,388,235],[1472,62,342,335],[1842,40,289,357]];
  const rewardFrames = [[88,438,222,234],[449,453,210,213],[751,476,308,163],[1171,466,210,204],[1524,438,209,231],[1805,399,349,296]];
  function cropSprite(selector, frame) {
    const svg = dialog.querySelector(selector);
    const id = 'frame-' + svg.classList[0];
    let rect = svg.querySelector('rect');
    if (!rect) {
      const ns = 'http://www.w3.org/2000/svg';
      const defs = document.createElementNS(ns, 'defs');
      const clip = document.createElementNS(ns, 'clipPath'); clip.id = id;
      rect = document.createElementNS(ns, 'rect'); clip.append(rect); defs.append(clip); svg.prepend(defs);
      svg.querySelector('image').setAttribute('clip-path', 'url(#' + id + ')');
    }
    ['x','y','width','height'].forEach((attribute, index) => rect.setAttribute(attribute, frame[index]));
    svg.setAttribute('viewBox', frame.join(' '));
  }
  const svgStart = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 563" aria-hidden="true" focusable="false"';
  const territories = [
    'M590 72Q660 42 738 51L892 78 942 150 898 225 812 220 744 199 665 187 598 148Z',
    'M627 191Q686 197 752 215L895 221 960 275 950 325 861 337 799 302 702 285 650 247Z',
    'M572 337L666 312 784 325 872 359 906 418 875 480 753 508 614 484 538 430Z',
    'M102 274L215 272 304 300 398 354 424 433 365 483 226 500 95 461 39 401 62 330Z',
    'M97 124L149 74 286 66 394 93 411 158 341 211 248 250 146 239 69 193Z',
    'M340 187L431 160 529 185 597 241 584 313 532 363 447 371 365 326 312 265Z'
  ];
  world.insertAdjacentHTML('beforeend', svgStart + ' class="map-territories">' + territories.map((path, index) => '<path class="map-territory" data-region="' + (index + 1) + '" d="' + path + '"/>').join('') + '</svg>');
  let live = svgStart + ' class="map-live"><defs><radialGradient id="live-fire"><stop stop-color="#fff5ac"/><stop offset=".35" stop-color="#ffbe43"/><stop offset="1" stop-color="#fa6912" stop-opacity="0"/></radialGradient><radialGradient id="live-portal"><stop stop-color="#f4c8ff" stop-opacity=".8"/><stop offset="1" stop-color="#bd64ff" stop-opacity="0"/></radialGradient></defs>';
  // Correntes e ondulações acompanham os cursos de água da pintura.
  live += '<g class="map-water"><path class="map-current" d="M343 216Q354 254 307 267T363 325Q404 334 419 371T460 420Q487 453 528 466"/><path class="map-current" d="M613 183Q638 210 672 232T748 263Q788 275 811 292T886 316"/><path class="map-current" d="M759 250Q767 269 787 275"/></g>';
  [[67,245],[462,519],[949,358],[924,187],[52,144]].forEach((p, i) => { live += '<ellipse class="map-sea-rings" cx="' + p[0] + '" cy="' + p[1] + '" rx="12" ry="4" style="animation-delay:-' + i * .7 + 's"/>'; });
  live += '<g class="map-forest-fire">';
  [[652,121],[697,145],[846,124],[886,146],[720,184],[803,182]].forEach((p, i) => {
    live += '<ellipse class="map-fire" cx="' + p[0] + '" cy="' + p[1] + '" rx="19" ry="21" style="animation-delay:-' + i * .27 + 's"/>';
    live += '<circle class="map-smoke" cx="' + p[0] + '" cy="' + (p[1] - 13) + '" r="8" style="animation-delay:-' + i * .62 + 's"/>';
    live += '<circle class="map-ember" cx="' + (p[0] + 5) + '" cy="' + (p[1] - 5) + '" r="1.5" style="animation-delay:-' + i * .45 + 's"/>';
  });
  live += '</g><ellipse class="map-portal" cx="477" cy="248" rx="28" ry="40"/>';
  [[456,241],[487,264],[491,228],[466,277],[501,253]].forEach((p,i) => { live += '<circle class="map-mote" cx="' + p[0] + '" cy="' + p[1] + '" r="1.8" style="animation-delay:-' + i * .8 + 's"/>'; });
  live += '<path class="map-birds" d="M128 86q4-7 8 0q4-7 8 0m15 8q3-5 6 0q3-5 6 0m-27 5q3-5 6 0q3-5 6 0"/><ellipse class="map-greening" cx="765" cy="150" rx="74" ry="45"/></svg>';
  world.insertAdjacentHTML('beforeend', live);
  // Animação CSS: nenhuma reprodução de GIF ou vídeo participa da interação.
  const regionNodes = [...world.querySelectorAll('[data-region]')];
  function highlight(phase, persistent = false) {
    regionNodes.forEach(node => {
      node.classList.toggle('is-highlighted', Number(node.dataset.region) === phase);
      if (persistent) node.classList.toggle('is-selected', Number(node.dataset.region) === phase);
    });
  }
  function tapRing(x, y) {
    if (!motionAllowed()) return;
    const ring = document.createElement('span'); ring.className = 'map-tap-ring';
    ring.style.left = x + 'px'; ring.style.top = y + 'px'; stage.append(ring);
    setTimeout(() => ring.remove(), 700);
  }
  stage.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; return; }
    const region = event.target.closest('[data-region]');
    const button = event.target.closest('button[data-phase]');
    if (!region && !button) return;
    const rect = stage.getBoundingClientRect();
    tapRing(event.clientX - rect.left, event.clientY - rect.top);
    if (region) {
      const target = world.querySelector('button[data-phase="' + region.dataset.region + '"]');
      target.focus({ preventScroll: true }); target.click();
    }
  }, true);
  world.addEventListener('pointerover', event => {
    const target = event.target.closest('[data-region],[data-phase]');
    if (target) highlight(Number(target.dataset.region || target.dataset.phase));
  });
  world.addEventListener('pointerleave', () => highlight(0));
  world.addEventListener('focusin', event => {
    if (event.target.dataset.phase) highlight(Number(event.target.dataset.phase));
  });
  world.addEventListener('focusout', () => highlight(0));

  function applyZoom() {
    const limitX = stage.clientWidth * (zoom - 1) / 2;
    const limitY = stage.clientHeight * (zoom - 1) / 2;
    pan.x = Math.max(-limitX, Math.min(limitX, pan.x));
    pan.y = Math.max(-limitY, Math.min(limitY, pan.y));
    world.style.setProperty('--map-zoom', zoom);
    world.style.setProperty('--pan-x', pan.x + 'px');
    world.style.setProperty('--pan-y', pan.y + 'px');
    stage.classList.toggle('is-zoomed', zoom > 1);
    document.getElementById('map-zoom-level').textContent = Math.round(zoom * 100) + '%';
    document.querySelector('[data-map-zoom="out"]').disabled = zoom === 1;
    document.querySelector('[data-map-zoom="in"]').disabled = zoom === 2.5;
    document.getElementById('map-explorer-help').textContent = zoom > 1 ? 'Arraste a ilha para explorar. Toque em uma região para ver a missão.' : 'Toque nas regiões para conhecer cada missão.';
  }
  document.querySelectorAll('[data-map-zoom]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.mapZoom === 'reset') { zoom = 1; pan = { x: 0, y: 0 }; }
    else zoom = Math.max(1, Math.min(2.5, zoom + (button.dataset.mapZoom === 'in' ? .5 : -.5)));
    applyZoom();
  }));
  stage.addEventListener('pointerdown', event => {
    if (zoom === 1 || event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: pan.x, startY: pan.y, moved: false };
    suppressClick = false;
  });
  stage.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx,dy) < 8) return;
    drag.moved = true; stage.classList.add('is-dragging');
    if (!stage.hasPointerCapture(event.pointerId)) stage.setPointerCapture(event.pointerId);
    pan = { x: drag.startX + dx, y: drag.startY + dy }; applyZoom(); event.preventDefault();
  });
  function stopDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick = drag.moved && event.type !== 'pointercancel';
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    drag = null; stage.classList.remove('is-dragging');
  }
  stage.addEventListener('pointerup', stopDrag); stage.addEventListener('pointercancel', stopDrag);
  // Soltar o dedo fora da ilha também encerra o arraste.
  window.addEventListener('pointerup', stopDrag); window.addEventListener('pointercancel', stopDrag);
  new ResizeObserver(applyZoom).observe(stage);

  function setPose(index) {
    if (!selected) return;
    const [top, height] = npcRows[selected.id - 1];
    const sequence = [0,1,2,1,0];
    cropSprite('.npc-sprite', [npcColumns[sequence[index % 5]], top, 296, height]);
    cropSprite('.kai-sprite', [index % 4 === 2 ? 627 : 0, 0, 627, 627]);
    dialog.dataset.pose = String(index % 5);
  }
  function updateMotion() {
    clearInterval(poseTimer); poseTimer = null;
    const active = dialog.open && motionAllowed();
    dialog.classList.toggle('pose-active', active);
    stage.classList.toggle('is-covered', dialog.open);
    if (active) poseTimer = setInterval(() => setPose(++pose), 1300);
    else if (selected) setPose(0);
  }
  function openPanel(phase) {
    clearTimeout(closeTimer); dialog.classList.remove('is-closing');
    selected = phase; pose = 0;
    opener = document.activeElement;
    dialog.dataset.phase = String(phase.id);
    document.getElementById('phase-npc').textContent = phase.npc;
    document.getElementById('phase-profession').textContent = phase.profissao;
    document.getElementById('phase-equipment-label').textContent = phase.rotulo_equipamento === 'VOCÊ USA' ? 'Você usa' : 'Você recebe';
    document.getElementById('phase-equipment').textContent = phase.equipamento;
    document.getElementById('phase-reward').textContent = phase.recompensa;
    document.getElementById('phase-duration').textContent = phase.duracao_estimada;
    const goals = document.getElementById('phase-goals'); goals.replaceChildren();
    phase.objetivos.forEach((text, index) => {
      const li = document.createElement('li'); li.textContent = text;
      li.style.setProperty('--goal-index', index); goals.append(li);
    });
    cropSprite('.equipment-sprite', equipmentFrames[phase.id - 1]);
    cropSprite('.reward-sprite', rewardFrames[phase.id - 1]);
    const start = dialog.querySelector('[data-map-action="start"]');
    start.textContent = phase.available ? 'Fase em desenvolvimento' : 'Fase bloqueada';
    start.disabled = true;
    highlight(phase.id, true); setPose(0);
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0; document.body.classList.add('map-panel-open'); updateMotion();
  }
  function closePanel() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (!motionAllowed()) { dialog.close(); return; }
    dialog.classList.add('is-closing'); clearInterval(poseTimer);
    closeTimer = setTimeout(() => { dialog.classList.remove('is-closing'); if (dialog.open) dialog.close(); }, 180);
  }
  dialog.addEventListener('cancel', event => { event.preventDefault(); closePanel(); });
  dialog.addEventListener('close', () => {
    clearTimeout(closeTimer); clearInterval(poseTimer);
    dialog.classList.remove('is-closing','pose-active'); stage.classList.remove('is-covered');
    document.body.classList.remove('map-panel-open'); highlight(0, true);
    opener?.focus({ preventScroll: true });
  });
  document.addEventListener('visibilitychange', updateMotion);
  reduced.addEventListener('change', updateMotion);
  new MutationObserver(updateMotion).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('guardiao:mapa-atualizado', event => {
    const state = event.detail;
    const phase = window.GuardiaoFases[state.current - 1];
    document.getElementById('journey-current').textContent = (state.preview ? 'Prévia · ' : '') + phase.nome.toLocaleLowerCase('pt-BR').replace(/(^|\s)\S/g, letter => letter.toLocaleUpperCase('pt-BR')).replace(/\b(Em|Da|Do|De|Das|Dos)\b/g, word => word.toLowerCase());
  });
  new MutationObserver(() => {
    stage.classList.toggle('is-recovering', stage.hasAttribute('aria-busy'));
    if (stage.hasAttribute('aria-busy')) { zoom = 1; pan = { x: 0, y: 0 }; applyZoom(); stage.scrollIntoView({ block: 'center', behavior: 'instant' }); }
  }).observe(stage, { attributes: true, attributeFilter: ['aria-busy'] });
  window.addEventListener('pagehide', () => { clearInterval(poseTimer); clearTimeout(closeTimer); });
  window.addEventListener('pageshow', updateMotion);
  window.GuardiaoPaineis = Object.freeze({ abrir: openPanel, fechar: closePanel });
  applyZoom();
})();
