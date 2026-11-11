import Phaser from 'phaser';
import { gsap } from 'gsap';

const status = document.getElementById('engine-status');
const toggle = document.getElementById('toggle');
const media = matchMedia('(prefers-reduced-motion: reduce)');
let preference = false;
try { preference = JSON.parse(localStorage.getItem('guardiao.horizonte.preferences.v1') || 'null')?.reduceMotion === true; } catch { /* Prévia sem armazenamento. */ }
let paused = preference || media.matches;
let kai;
let glow;
const asset = path => new URL(`../../${path}`, document.baseURI).href;

class Preview extends Phaser.Scene {
  preload() {
    this.load.spritesheet('kai', asset('assets/itens-remodelados/kai/01_mangueira.png'), { frameWidth: 362, frameHeight: 362 });
    this.load.on('loaderror', () => { status.textContent = 'O sprite não carregou. Confira a conexão e atualize a prévia.'; document.body.dataset.loadError = 'true'; });
  }
  create() {
    if (!this.textures.exists('kai')) return;
    this.add.rectangle(0, 0, 2000, 2000, 0x214f37).setOrigin(0);
    glow = this.add.ellipse(0, 0, 180, 24, 0x102d24, .45);
    kai = this.add.sprite(0, 0, 'kai', 6);
    // A água da célula anterior invade a margem esquerda da folha fornecida.
    // Recorta só essa margem na renderização, mantendo o PNG original intacto.
    kai.setCrop(50, 0, 312, 362);
    this.anims.create({ key: 'mangueira', frames: this.anims.generateFrameNumbers('kai', { start: 6, end: 11 }), frameRate: 6, repeat: -1 });
    kai.play('mangueira');
    if (paused) kai.anims.pause();
    const resize = () => {
      const { width, height } = this.scale;
      kai.setPosition(width / 2, height / 2).setScale(Math.min(height / 380, width / 420, 1.1));
      glow.setPosition(width / 2, height * .88);
    };
    resize(); this.scale.on('resize', resize);
    toggle.disabled = false; toggle.textContent = paused ? 'Reproduzir animação' : 'Pausar animação';
    status.textContent = `Phaser ${Phaser.VERSION} e GSAP ${gsap.version} prontos`;
    document.body.dataset.engineReady = 'true';
    const animation = gsap.fromTo(status, { opacity: .35 }, { opacity: 1, duration: .5, onComplete: () => { document.body.dataset.gsapReady = 'true'; } });
    if (paused) animation.progress(1);
  }
}

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  backgroundColor: '#214f37',
  render: { antialias: true },
  scale: { mode: Phaser.Scale.RESIZE, width: 800, height: 380 },
  scene: Preview,
  banner: false
});

toggle.addEventListener('click', () => {
  if (!kai) return;
  paused = !paused;
  if (paused) kai.anims.pause(); else kai.anims.resume();
  toggle.textContent = paused ? 'Reproduzir animação' : 'Pausar animação';
});
media.addEventListener('change', event => {
  if (!event.matches || !kai) return;
  paused = true; kai.anims.pause(); toggle.textContent = 'Reproduzir animação';
});
// Dados de diagnóstico somente na área de desenvolvimento.
window.GuardiaoLaboratorio = Object.freeze({
  versoes: () => ({ phaser: Phaser.VERSION, gsap: gsap.version }),
  quadro: () => kai?.frame.name,
  pausado: () => paused,
  ativo: () => game.isRunning
});
