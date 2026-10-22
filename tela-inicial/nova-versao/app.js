'use strict';
(() => {
  const storageKey = 'guardiao.horizonte.preferences.v1';
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const defaults = { music: false, musicVolume: 40, effects: true, effectsVolume: 60, largeText: false, fallingLeaves: true, reduceMotion: false, leftHanded: false, controlSize: 0, contextHints: true };
  let preferences = { ...defaults };
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    const legacy = JSON.parse(localStorage.getItem('guardiao.menu.preferences') || 'null');
    if (!saved && legacy) {
      if (typeof legacy.sound === 'boolean') preferences.effects = legacy.sound;
      // A opção antiga controlava apenas folhas, não as trocas de tela.
      if (typeof legacy.motion === 'boolean') preferences.fallingLeaves = legacy.motion;
    }
    if (saved && typeof saved === 'object') for (const key of Object.keys(defaults)) {
      if (typeof defaults[key] === 'boolean' && typeof saved[key] === 'boolean') preferences[key] = saved[key];
      if (typeof defaults[key] === 'number' && typeof saved[key] === 'number' && Number.isFinite(saved[key])) preferences[key] = Math.min(100, Math.max(0, saved[key]));
    }
  } catch { storageAvailable = false; }
  const status = document.getElementById('save-status');
  const form = document.getElementById('preferences');
  let audioContext;
  let musicGain;
  let musicTimer;
  let musicStep = 0;
  const melody = [293.66, 392, 440, 392, 329.63, 293.66, 261.63, 329.63, 392, 523.25, 440, 392];
  function announce(text) { if (status) status.textContent = text; }
  function getAudio() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    try {
      if (!audioContext) { audioContext = new Audio(); musicGain = audioContext.createGain(); musicGain.gain.value = 0; musicGain.connect(audioContext.destination); }
      audioContext.resume().catch(() => announce('O navegador não liberou o áudio. Toque novamente em um controle.'));
      return audioContext;
    } catch { announce('O áudio não está disponível neste navegador.'); return null; }
  }
  function note(frequency, duration, volume, destination, offset = 0) {
    const now = audioContext.currentTime + offset;
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.035);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope); envelope.connect(destination);
    oscillator.start(now); oscillator.stop(now + duration + 0.02);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }
  function clickSound(force = false) {
    if ((!preferences.effects && !force) || preferences.effectsVolume === 0) return;
    if (!getAudio()) return;
    const volume = preferences.effectsVolume / 100 * 0.08;
    note(659.25, 0.16, volume, audioContext.destination);
    note(987.77, 0.2, volume * 0.6, audioContext.destination, 0.07);
  }
  function stopMusic() {
    clearInterval(musicTimer); musicTimer = null;
    if (musicGain) musicGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.07);
  }
  function updateMusic(fromGesture = false) {
    if (!preferences.music || document.hidden) { stopMusic(); return; }
    if (!audioContext && !fromGesture) return;
    if (!getAudio()) return;
    musicGain.gain.setTargetAtTime(preferences.musicVolume / 100 * 0.3, audioContext.currentTime, 0.15);
    if (musicTimer) return;
    const tick = () => { const pitch = melody[musicStep % melody.length]; note(pitch, 1.35, 0.24, musicGain); if (musicStep % 4 === 0) note(146.83, 2.1, 0.08, musicGain); musicStep++; };
    tick(); musicTimer = setInterval(tick, 740);
  }
  function apply() {
    document.documentElement.classList.toggle('large-text', preferences.largeText);
    document.body.classList.toggle('reduce-motion', preferences.reduceMotion || media.matches);
    document.body.classList.toggle('still-leaves', !preferences.fallingLeaves);
    const motionStatus = document.getElementById('motion-status');
    if (motionStatus) motionStatus.textContent = media.matches
      ? 'Seu dispositivo solicita movimento reduzido. As telas usam uma transição suave de transparência, sem círculo nem folhas.'
      : preferences.reduceMotion
        ? 'Movimento reduzido: as telas usam uma transição suave de transparência, sem círculo nem folhas.'
        : 'Transições com círculo e folhas ativadas.';
    if (form) for (const key of Object.keys(defaults)) {
      const input = document.getElementById(key); if (!input) continue;
      if (input.type === 'checkbox') input.checked = preferences[key];
      else { input.value = preferences[key]; const output = document.getElementById(`${key}Value`); if (output) output.value = `${preferences[key]}%`; }
    }
    updateMusic();
  }
  function save() {
    apply();
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)); announce('Preferências salvas neste navegador.'); storageAvailable = true; }
    catch { storageAvailable = false; announce('Preferências aplicadas nesta sessão. O navegador bloqueou o armazenamento.'); }
    if (media.matches) announce('Preferência do dispositivo respeitada: transições suaves, sem movimento de folhas ou círculo.');
  }
  form?.addEventListener('submit', event => event.preventDefault());
  form?.addEventListener('input', event => {
    const input = event.target;
    if (!Object.hasOwn(defaults, input.name)) return;
    preferences[input.name] = input.type === 'checkbox' ? input.checked : Number(input.value);
    save();
    if (input.name === 'music' || input.name === 'musicVolume') updateMusic(true);
    if (input.name === 'effects') clickSound();
  });
  document.getElementById('preview-sound')?.addEventListener('click', () => clickSound(true));
  document.getElementById('reset')?.addEventListener('click', () => { preferences = { ...defaults }; save(); });
  document.addEventListener('click', event => { if (event.target.closest('a, [role="tab"], [data-companion], [data-react="necklace"]')) clickSound(); updateMusic(true); });
  const unlock = () => updateMusic(true);
  document.addEventListener('pointerdown', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(tab, focus = false) {
    for (const item of tabs) { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; document.getElementById(item.getAttribute('aria-controls')).hidden = !selected; }
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
    });
  });
  const layer = document.querySelector('.leaves');
  const compact = window.matchMedia('(max-width: 650px)');
  function createLeaves() {
    if (!layer || layer.hidden) return;
    if (window.GuardiaoFolhas) { window.GuardiaoFolhas.preparar(layer, { compact: compact.matches }); return; }
    const fragment = document.createDocumentFragment(); const count = compact.matches ? 10 : 18;
    for (let i = 0; i < count; i++) {
      const leaf = document.createElement('span'); leaf.className = 'leaf-particle';
      const time = 14 + Math.random() * 9;
      const properties = { '--size': `${28 + Math.random() * 28}px`, '--duration': `${time}s`, '--delay': `${-time * (i + 0.5) / count}s`, '--x': `${i % 4 * 100 / 3}%`, '--y': `${Math.floor(i % 8 / 4) * 100}%`, '--drift': `${Math.random() * 150 - 60}px` };
      leaf.style.left = `${i / count * 100}%`;
      for (const [name, value] of Object.entries(properties)) leaf.style.setProperty(name, value);
      leaf.append(document.createElement('span')); fragment.append(leaf);
    }
    layer.replaceChildren(fragment);
  }
  document.addEventListener('visibilitychange', () => { document.body.classList.toggle('page-hidden', document.hidden); updateMusic(); });
  media.addEventListener('change', apply);
  compact.addEventListener('change', createLeaves);
  apply(); createLeaves();
  if (!storageAvailable) announce('As preferências funcionam nesta sessão; o armazenamento está indisponível.');
  if (media.matches) announce('Preferência do dispositivo respeitada: transições suaves, sem movimento de folhas ou círculo.');
  if (!window.AudioContext && !window.webkitAudioContext && form) {
    for (const id of ['music', 'musicVolume', 'effects', 'effectsVolume', 'preview-sound']) document.getElementById(id).disabled = true;
    announce('Este navegador não oferece áudio. As demais preferências continuam disponíveis.');
  }
})();
