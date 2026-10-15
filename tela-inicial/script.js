'use strict';
const defaults = { sound: false, motion: !window.matchMedia('(prefers-reduced-motion: reduce)').matches };
let preferences = { ...defaults };
try {
  const saved = JSON.parse(localStorage.getItem('guardiao.menu.preferences') || '{}');
  for (const key of Object.keys(defaults)) if (typeof saved[key] === 'boolean') preferences[key] = saved[key];
} catch { /* O menu continua funcionando se o armazenamento estiver indisponível. */ }
const soundInput = document.getElementById('sound');
const motionInput = document.getElementById('motion');
const status = document.getElementById('settings-status');
let audioContext;
function applyPreferences() {
  soundInput.checked = preferences.sound;
  motionInput.checked = preferences.motion;
  document.body.classList.toggle('no-motion', !preferences.motion);
}
function savePreferences() {
  applyPreferences();
  try {
    localStorage.setItem('guardiao.menu.preferences', JSON.stringify(preferences));
    status.textContent = 'Preferências salvas neste navegador.';
  } catch {
    status.textContent = 'Preferências aplicadas nesta sessão; o navegador bloqueou o armazenamento.';
  }
}
function playClick() {
  if (!preferences.sound) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audioContext ||= new Audio();
    audioContext.resume().catch(() => {});
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.exponentialRampToValueAtTime(990, now + 0.1);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(now); oscillator.stop(now + 0.17);
  } catch { /* Áudio é opcional e não deve bloquear a navegação. */ }
}
document.querySelectorAll('[data-dialog]').forEach(button => {
  button.addEventListener('click', () => {
    playClick();
    document.getElementById(button.dataset.dialog).showModal();
  });
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => { playClick(); dialog.close(); });
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
});
soundInput.addEventListener('change', () => { preferences.sound = soundInput.checked; savePreferences(); playClick(); });
motionInput.addEventListener('change', () => { preferences.motion = motionInput.checked; savePreferences(); });
document.querySelectorAll('a').forEach(link => link.addEventListener('click', playClick));
const fullscreen = document.getElementById('fullscreen');
if (!document.fullscreenEnabled) { fullscreen.hidden = true; }
fullscreen.addEventListener('click', async () => {
  playClick();
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { status.textContent = 'Este navegador não permitiu ativar a tela cheia.'; }
});
document.addEventListener('fullscreenchange', () => {
  fullscreen.textContent = document.fullscreenElement ? 'SAIR DA TELA CHEIA' : 'ENTRAR EM TELA CHEIA';
});
applyPreferences();

// Flores e pétalas sobre o cenário. A imagem de Kai e Flora permanece estática.
const flowerLayer = document.querySelector('.falling-flowers');
const compactScreen = window.matchMedia('(max-width: 760px)');
function createFallingFlowers() {
  const fragment = document.createDocumentFragment();
  const count = compactScreen.matches ? 14 : 26;
  for (let i = 0; i < count; i++) {
    const flower = document.createElement('span');
    flower.className = 'falling-flower';
    const art = document.createElement('span');
    art.className = i % 3 === 0 ? 'flower-art blossom' : 'flower-art petal';
    const duration = 15 + Math.random() * 13;
    flower.style.left = `${(i + Math.random()) / count * 100}%`;
    flower.style.setProperty('--fall-duration', `${duration}s`);
    flower.style.setProperty('--fall-delay', `${-Math.random() * duration}s`);
    flower.style.setProperty('--flower-size', `${i % 3 === 0 ? 20 + Math.random() * 14 : 12 + Math.random() * 12}px`);
    flower.style.setProperty('--drift', `${25 + Math.random() * 55}px`);
    flower.style.setProperty('--sway', `${8 + Math.random() * 18}px`);
    flower.style.setProperty('--sway-duration', `${3 + Math.random() * 3}s`);
    flower.style.setProperty('--turn', `${Math.random() * 180}deg`);
    flower.style.setProperty('--tint', `${Math.random() * 24 - 12}deg`);
    flower.append(art);
    fragment.append(flower);
  }
  flowerLayer.replaceChildren(fragment);
}
function resizeFlowerLayer() {
  flowerLayer.style.setProperty('--fall-distance', `${document.querySelector('.scene').clientHeight + 130}px`);
}
createFallingFlowers();
resizeFlowerLayer();
compactScreen.addEventListener('change', createFallingFlowers);
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resizeFlowerLayer).observe(document.querySelector('.scene'));
else window.addEventListener('resize', resizeFlowerLayer);
function pauseBackground() {
  document.body.classList.toggle('page-hidden', document.hidden);
}
document.addEventListener('visibilitychange', pauseBackground);
pauseBackground();
