'use strict';
(() => {
  const camp = document.querySelector('.companions-camp');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const gsap = window.gsap;
  const speech = camp?.querySelector('.camp-speech');
  const actors = { kai: camp?.querySelector('.camp-kai-sprite'), flora: camp?.querySelector('.camp-flora-sprite') };
  const reactions = new Map();
  let idleTimer, turn = 0, soundTimer;
  const counters = { kai: 0, flora: 0 };
  const lines = {
    kai: ['Kai: Cada pequeno cuidado faz diferença. Vamos juntos?', 'Kai: Nossa primeira parada é a Floresta em Chamas. Carlos precisa de ajuda!', 'Kai: Um guardião também precisa descansar. Ajuste tudo no seu ritmo.'],
    flora: ['Flora: Huu-huu! Estou de olho na nossa próxima aventura.', 'Flora: Uma floresta cheia de vida começa com pequenos gestos.', 'Flora: Vou voando na frente. Encontro você no mapa das fases!']
  };
  const motionAllowed = () => !media.matches && !document.body.classList.contains('reduce-motion') && !document.hidden;
  function setPose(name, index) {
    const svg = actors[name]; if (!svg) return;
    const size = name === 'kai' ? 627 : 512;
    const columns = name === 'kai' ? 2 : 3;
    const frame = [index % columns * size, Math.floor(index / columns) * size, size, size];
    svg.setAttribute('viewBox', frame.join(' '));
    const rect = svg.querySelector('rect');
    ['x','y','width','height'].forEach((attribute,i) => rect.setAttribute(attribute,frame[i]));
    svg.dataset.pose = String(index);
  }
  function resetActor(name) {
    reactions.get(name)?.kill(); reactions.delete(name);
    const actor = actors[name]; if (!actor) return;
    actor.getAnimations().forEach(animation => animation.cancel());
    if (gsap) gsap.set(actor, { clearProps:'transform,filter' });
    else actor.style.removeProperty('transform');
    setPose(name,0);
  }
  function react(name, kind = 'click') {
    const actor = actors[name]; if (!actor) return;
    resetActor(name);
    if (!motionAllowed()) return;
    if (!gsap) { actor.animate?.([{transform:'translateY(0)'},{transform:'translateY(-7px)'},{transform:'translateY(0)'}], {duration:400}); return; }
    const timeline = gsap.timeline({ onComplete:() => { reactions.delete(name); setPose(name,0); } });
    reactions.set(name,timeline);
    if (kind === 'idle') {
      timeline.call(() => setPose(name,name === 'flora' ? 1 : 2)).to({}, {duration:name === 'flora' ? .18 : .8}).call(() => setPose(name,0));
    } else if (name === 'flora') {
      timeline.call(() => setPose(name,kind === 'hover' ? 2 : 3))
        .to(actor,{y:-8,rotation:-5,duration:.18,ease:'power2.out'})
        .call(() => setPose(name,4)).to(actor,{y:-15,rotation:4,duration:.17,ease:'power1.inOut'})
        .call(() => setPose(name,3)).to(actor,{y:0,rotation:0,duration:.32,ease:'back.out(1.5)'})
        .call(() => setPose(name,5)).to({}, {duration:.55});
    } else {
      timeline.call(() => setPose(name,kind === 'hover' ? 1 : 3))
        .to(actor,{y:-5,rotation:-2,duration:.2,ease:'power2.out'})
        .to(actor,{y:0,rotation:1,duration:.3,ease:'back.out(1.4)'})
        .call(() => setPose(name,2)).to({}, {duration:.65}).to(actor,{rotation:0,duration:.2});
    }
  }
  function say(message) { if (speech) speech.textContent = message; }
  camp?.querySelectorAll('[data-companion]').forEach(button => {
    const name = button.dataset.companion;
    button.addEventListener('click', () => { say(lines[name][counters[name]++ % lines[name].length]); react(name); });
    button.addEventListener('pointerenter', () => { if (finePointer.matches) react(name,'hover'); });
    button.addEventListener('focus', () => { if (button.matches(':focus-visible')) react(name,'hover'); });
  });
  function syncMotion() {
    clearInterval(idleTimer); idleTimer = null;
    if (!motionAllowed()) {
      resetActor('kai'); resetActor('flora');
      const necklace = document.querySelector('.necklace-sprite');
      if (gsap && necklace) { gsap.killTweensOf(necklace); gsap.set(necklace, { clearProps:'transform,filter' }); }
      return;
    }
    if (camp) idleTimer = setInterval(() => { const name = ++turn % 3 === 0 ? 'kai' : 'flora'; if (!reactions.has(name)) react(name,'idle'); }, 3800);
  }
  let previousClassState = '';
  const observePreferences = () => {
    const state = String(document.body.classList.contains('reduce-motion')) + String(document.hidden);
    if (state === previousClassState) return;
    previousClassState = state; syncMotion();
  };
  new MutationObserver(observePreferences).observe(document.body,{attributes:true,attributeFilter:['class']});
  media.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('pagehide', () => { clearInterval(idleTimer); clearTimeout(soundTimer); resetActor('kai'); resetActor('flora'); });
  window.addEventListener('pageshow', syncMotion);
  // Resposta visual ao toque também aparece em botões operados pelo teclado.
  function ripple(button, event) {
    if (!motionAllowed() || button.disabled) return;
    button.querySelectorAll('.menu-click-layer').forEach(node => node.remove());
    const rect = button.getBoundingClientRect();
    const node = document.createElement('span'); node.className = 'menu-click-ripple'; node.setAttribute('aria-hidden','true');
    node.style.setProperty('--ripple-size',Math.max(rect.width,rect.height)*1.5 + 'px');
    node.style.setProperty('--ripple-x',(event.detail === 0 ? rect.width/2 : event.clientX-rect.left) + 'px');
    node.style.setProperty('--ripple-y',(event.detail === 0 ? rect.height/2 : event.clientY-rect.top) + 'px');
    const layer = document.createElement('span'); layer.className = 'menu-click-layer'; layer.setAttribute('aria-hidden','true');
    layer.append(node); button.append(layer); setTimeout(() => layer.remove(),600);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button,a');
    if (button && !button.matches('.skip-link')) ripple(button,event);
  });
  function updateRanges() {
    document.querySelectorAll('input[type=range]').forEach(input => input.style.setProperty('--volume',input.value+'%'));
  }
  document.getElementById('preferences')?.addEventListener('input', event => {
    const input = event.target; updateRanges();
    const line = input.closest('.setting-line,.volume-line');
    if (line && input.type === 'checkbox' && motionAllowed()) { line.classList.remove('setting-changed'); void line.offsetWidth; line.classList.add('setting-changed'); }
    if (input.type === 'checkbox') {
      const messages = {
        music: input.checked ? 'Kai: A trilha sonora deixa a jornada ainda mais especial.' : 'Kai: Vamos ouvir a tranquilidade da floresta.',
        effects: 'Flora: Os sons ficam do jeitinho que você escolher.',
        largeText: input.checked ? 'Kai: Assim fica mais fácil ler cada descoberta.' : 'Kai: Pronto! O texto voltou ao tamanho padrão.',
        fallingLeaves: input.checked ? 'Flora: Olhe a brisa brincando com as folhas!' : 'Flora: Um cenário mais tranquilo também é bonito.',
        reduceMotion: input.checked ? 'Flora: Vamos ficar quietinhos. A aventura continua no seu ritmo.' : 'Flora: Huu-huu! Pronta para me mexer de novo!'
      };
      say(messages[input.id] || 'Kai: Pronto, ajuste feito!');
      if (input.id !== 'reduceMotion') react(input.id === 'fallingLeaves' ? 'flora' : 'kai');
    }
  });
  document.getElementById('reset')?.addEventListener('click', () => { updateRanges(); say('Kai: Os ajustes voltaram ao começo. Vamos recomeçar?'); react('kai'); });
  document.getElementById('preview-sound')?.addEventListener('click', event => {
    const button = event.currentTarget; clearTimeout(soundTimer); button.classList.remove('is-playing-sound');
    if (motionAllowed()) { void button.offsetWidth; button.classList.add('is-playing-sound'); }
    soundTimer = setTimeout(() => button.classList.remove('is-playing-sound'),1500);
    say(Number(document.getElementById('effectsVolume').value) === 0 ? 'Flora: Aumente o volume dos efeitos para ouvir o teste.' : 'Flora: Huu-huu! Esse é o som dos nossos botões.'); react('flora');
  });
  document.querySelector('[data-react="necklace"]')?.addEventListener('click', event => {
    say('Kai: Cinco peças, um só colar. Cada missão é um novo cuidado com a natureza.');
    const sprite = event.currentTarget.querySelector('.necklace-sprite');
    if (gsap && motionAllowed()) { gsap.killTweensOf(sprite); gsap.fromTo(sprite,{scale:1,rotation:0,filter:'brightness(1)'},{keyframes:[{scale:1.08,rotation:-4,filter:'brightness(1.25)',duration:.22},{scale:1,rotation:0,filter:'brightness(1)',duration:.45}],ease:'power2.out'}); }
    react('kai');
  });
  document.querySelectorAll('[role="tab"]').forEach(tab => tab.addEventListener('click', () => {
    const messages = { 'tab-story':'Kai: A melhor parte da jornada é ter amigos por perto.', 'tab-controls':'Flora: Seus dedos vão guiar a nossa aventura!', 'tab-mission':'Kai: Cada peça do colar representa uma natureza mais viva.' };
    say(messages[tab.id]); react(tab.id === 'tab-controls' ? 'flora' : 'kai');
  }));
  setPose('kai',0); setPose('flora',0); updateRanges(); syncMotion();
})();
