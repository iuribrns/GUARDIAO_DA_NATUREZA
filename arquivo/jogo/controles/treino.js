'use strict';
(() => {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-control-demo]').forEach(scene => {
    const player = scene.querySelector('.training-kai');
    const controls = scene.querySelector('[data-guardiao-controles]');
    const message = scene.parentElement.querySelector('.training-status');
    const panel = scene.closest('[role=tabpanel]');
    const animator = window.GuardiaoKaiAnimado ? new window.GuardiaoKaiAnimado(player) : null;
    if (!animator) player.dataset.spriteStatus='unavailable';
    let x=.45, height=0, velocity=0, move=0, horizontalVelocity=0, facing=1;
    let frame=0, idleTimer=0, previous=0, distance=0, airTime=0, idleTime=0;
    let preparation=0, landingRemaining=0, walking=false;
    const reduced = () => media.matches || document.body.classList.contains('reduce-motion');
    const visible = () => !document.hidden && !panel?.hidden;
    function state() {
      if (preparation>0) return 'preparando';
      if (height>0 || velocity>0) return 'no-ar';
      if (landingRemaining>0) return 'aterrissando';
      return walking ? 'andando' : 'parado';
    }
    function render() {
      const width=Math.max(0,scene.clientWidth-104);
      player.style.left=x*width+'px'; player.style.bottom=116+height+'px';
      player.style.setProperty('--facing',facing); player.classList.toggle('is-jumping',height>.5);
      player.dataset.grounded=String(height===0);
      animator?.update({state:state(),distance,velocity,height,airTime,landing:.14-landingRemaining,idleTime,reduced:reduced()});
    }
    function tick(time) {
      frame=0;
      if (!visible()) { stop(); return; }
      const elapsed=previous ? Math.min((time-previous)/1000,.25) : .016;
      const dt=Math.min(elapsed,.032); previous=time;
      const target=move*150;
      if (target===0) horizontalVelocity=0;
      else horizontalVelocity+=Math.max(-1300*dt,Math.min(1300*dt,target-horizontalVelocity));
      const width=Math.max(1,scene.clientWidth-104), before=x;
      x=Math.max(0,Math.min(1,x+horizontalVelocity*dt/width));
      const travelled=Math.abs(x-before)*width; distance+=travelled; walking=travelled>.001;
      if (Math.abs(horizontalVelocity)>.1) facing=horizontalVelocity>0 ? 1 : -1;
      if (preparation>0) {
        preparation=Math.max(0,preparation-dt);
        if (preparation===0) { velocity=390; airTime=0; }
      }
      if (height>0 || velocity>0) {
        airTime+=dt; velocity-=1100*dt; height=Math.max(0,height+velocity*dt);
        if (height===0) { velocity=0; landingRemaining=.14; }
      } else if (landingRemaining>0) landingRemaining=Math.max(0,landingRemaining-dt);
      idleTime=state()==='parado' ? idleTime+elapsed : 0;
      render();
      if (Math.abs(move)>.01 || height>0 || velocity>0 || preparation>0 || landingRemaining>0) frame=requestAnimationFrame(tick);
      else if (!reduced()) idleTimer=setTimeout(()=>{idleTimer=0;frame=requestAnimationFrame(tick);},100);
      else previous=0;
    }
    function start() {
      clearTimeout(idleTimer); idleTimer=0;
      if (!frame && visible()) { previous=0; frame=requestAnimationFrame(tick); }
    }
    function stop() {
      cancelAnimationFrame(frame); clearTimeout(idleTimer); frame=idleTimer=0; previous=0;
      move=horizontalVelocity=velocity=height=preparation=landingRemaining=idleTime=0; walking=false; render();
    }
    controls.addEventListener('guardiao:controle',event => {
      const input=event.detail;
      if (input.tipo==='mover') {
        move=input.x;
        if (move===0) {horizontalVelocity=0;walking=false;render();}
        start();
      }
      if (input.tipo==='pular' && height===0 && velocity===0 && preparation===0) {
        preparation=.045;landingRemaining=0;start();render();
        message.textContent='Boa! Kai prepara o salto, sobe e aterrissa. Você pode pular enquanto segura o joystick.';
      }
      if (input.tipo==='usar') message.textContent='Este é o botão de ação para usar equipamentos e conversar nas fases.';
    });
    if (panel) new MutationObserver(()=>{
      if (panel.hidden) { controls.controlesGuardiao.reset(); stop(); } else start();
    }).observe(panel,{attributes:true,attributeFilter:['hidden']});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
    window.addEventListener('pagehide',stop); window.addEventListener('pageshow',start);
    let wasReduced=reduced();
    const updateMotion=()=>{const value=reduced();if(value!==wasReduced){wasReduced=value;idleTime=0;start();}};
    media.addEventListener('change',updateMotion);
    new MutationObserver(updateMotion).observe(document.body,{attributes:true,attributeFilter:['class']});
    new ResizeObserver(render).observe(scene);
    animator?.ready.then(()=>{render();start();}).catch(()=>{
      message.textContent='Os sprites animados não carregaram. Os controles continuam disponíveis; atualize para tentar novamente.';
    });
    render();scene.dataset.demoReady='true';
  });
})();
