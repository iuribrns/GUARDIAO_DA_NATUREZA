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
const backgroundVideo = document.querySelector('.scenery-video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function applyPreferences() {
  soundInput.checked = preferences.sound;
  motionInput.checked = preferences.motion;
  document.body.classList.toggle('no-motion', !preferences.motion);
  syncBackgroundVideo();
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

// O vídeo move apenas o cenário; duas imagens recortadas mantêm Kai e Flora parados.
function syncBackgroundVideo() {
  const shouldPlay = preferences.motion && !reducedMotion.matches && !document.hidden;
  if (!shouldPlay) {
    backgroundVideo.pause();
    document.body.classList.remove('video-running');
    return;
  }
  backgroundVideo.muted = true;
  backgroundVideo.play().then(() => {
    if (preferences.motion && !reducedMotion.matches && !document.hidden) document.body.classList.add('video-running');
    else backgroundVideo.pause();
  }).catch(() => document.body.classList.remove('video-running'));
}
function fitBackgroundFrame() {
  const scene = document.querySelector('.scene');
  const frame = document.querySelector('.scenery-frame');
  const width = Math.max(scene.clientWidth, scene.clientHeight * 16 / 9);
  frame.style.width = `${width}px`;
  frame.style.height = `${width * 9 / 16}px`;
}
fitBackgroundFrame();
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fitBackgroundFrame).observe(document.querySelector('.scene'));
else window.addEventListener('resize', fitBackgroundFrame);
reducedMotion.addEventListener('change', syncBackgroundVideo);
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('page-hidden', document.hidden);
  syncBackgroundVideo();
});
backgroundVideo.addEventListener('error', () => document.body.classList.remove('video-running'));
