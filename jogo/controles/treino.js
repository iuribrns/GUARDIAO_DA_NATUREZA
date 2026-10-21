'use strict';
(() => {
  document.querySelectorAll('[data-control-demo]').forEach(scene => {
    const player = scene.querySelector('.training-kai');
    const controls = scene.querySelector('[data-guardiao-controles]');
    const message = scene.parentElement.querySelector('.training-status');
    const panel = scene.closest('[role=tabpanel]');
    let x = .45, height = 0, velocity = 0, move = 0, facing = 1, frame = 0, previous = 0;
    function render() {
      const width = Math.max(0,scene.clientWidth-72);
      player.style.left = x*width + 'px'; player.style.bottom = 116+height + 'px';
      player.style.setProperty('--facing',facing); player.classList.toggle('is-jumping',height > .5);
      player.dataset.grounded = String(height === 0);
    }
    function tick(time) {
      frame = 0;
      if (document.hidden || panel?.hidden) { stop(); return; }
      const dt = previous ? Math.min((time-previous)/1000,.032) : .016; previous = time;
      x = Math.max(0,Math.min(1,x + move*150*dt/Math.max(1,scene.clientWidth-72)));
      if (move !== 0) facing = move > 0 ? 1 : -1;
      if (height > 0 || velocity > 0) { velocity -= 1100*dt; height = Math.max(0,height+velocity*dt); if (height === 0) velocity = 0; }
      render();
      if (Math.abs(move) > .01 || height > 0 || velocity > 0) frame = requestAnimationFrame(tick);
      else previous = 0;
    }
    function start() { if (!frame) { previous = 0; frame = requestAnimationFrame(tick); } }
    function stop() { cancelAnimationFrame(frame); frame = 0; previous = 0; move = 0; velocity = 0; height = 0; render(); }
    controls.addEventListener('guardiao:controle',event => {
      const input = event.detail;
      if (input.tipo === 'mover') { move = input.x; start(); }
      if (input.tipo === 'pular' && height === 0 && velocity === 0) { velocity = 390; start(); message.textContent = 'Boa! Você também pode pular enquanto segura o joystick.'; }
      if (input.tipo === 'usar') { message.textContent = 'Este é o botão de ação para usar equipamentos e conversar nas fases.'; }
    });
    if (panel) new MutationObserver(() => { if (panel.hidden) { controls.controlesGuardiao.reset(); stop(); } }).observe(panel,{attributes:true,attributeFilter:['hidden']});
    document.addEventListener('visibilitychange',() => { if (document.hidden) stop(); });
    window.addEventListener('pagehide',stop);
    new ResizeObserver(render).observe(scene);
    render(); scene.dataset.demoReady = 'true';
  });
})();
