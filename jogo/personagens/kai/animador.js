'use strict';
(() => {
  const base = new URL('../../../assets/personagens/kai/animacoes/',document.currentScript.src);
  const atlas = window.GuardiaoKaiAtlas;
  if (!atlas?.frames) return;
  let imagePromise;
  function loadImages() {
    if (!imagePromise) imagePromise = Promise.all(Object.entries(atlas.images).map(async ([key,source]) => {
      const image = new Image(); image.src = new URL(source.file,base).href;
      await image.decode();
      if (image.naturalWidth !== source.width || image.naturalHeight !== source.height) throw new Error('Prancha de Kai com dimensões inesperadas.');
      return [key,image];
    })).then(entries=>new Map(entries));
    return imagePromise;
  }
  class GuardiaoKaiAnimado {
    constructor(element) {
      this.element = element; this.current = null; this.images = null;
      const {width,height} = atlas.render;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'kai-animation-canvas'; this.canvas.setAttribute('aria-hidden','true');
      const ratio = Math.min(devicePixelRatio || 1,2);
      this.canvas.width = width*ratio; this.canvas.height = height*ratio;
      this.context = this.canvas.getContext('2d'); this.context.scale(ratio,ratio);
      this.context.imageSmoothingEnabled = true; this.context.imageSmoothingQuality = 'high';
      element.dataset.spriteStatus = 'loading';
      this.ready = loadImages().then(images => {
        this.images = images; element.append(this.canvas); element.classList.add('has-sprites');
        element.dataset.spriteStatus = 'ready'; this.draw('parado_01'); return this;
      }).catch(error => { element.dataset.spriteStatus = 'error'; throw error; });
    }
    draw(id) {
      if (!this.images || this.current === id) return;
      const frame = atlas.frames[id]; if (!frame) throw new RangeError('Quadro de Kai desconhecido: '+id);
      const spec = atlas.images[frame.sheet], [sx,sy,sw,sh] = frame.bounds;
      const [px,py] = frame.pivot, [anchorX,anchorY] = atlas.render.anchor;
      this.context.clearRect(0,0,atlas.render.width,atlas.render.height);
      this.context.drawImage(this.images.get(frame.sheet),sx,sy,sw,sh,anchorX+(sx-px)*spec.scale,anchorY+(sy-py)*spec.scale,sw*spec.scale,sh*spec.scale);
      this.current = id; this.element.dataset.spriteFrame = id;
    }
    update({state='parado',distance=0,velocity=0,height=0,airTime=0,landing=0,idleTime=0,reduced=false}={}) {
      let id;
      if (state === 'preparando') id = 'pulo_01';
      else if (state === 'no-ar') {
        const phase = airTime < .075 ? 1 : velocity > 110 ? 2 : Math.abs(velocity) <= 110 ? 3 : height > 25 ? 4 : 5;
        id = atlas.animations.pulo.frames[phase];
      } else if (state === 'aterrissando') id = landing < .065 ? 'pulo_07' : 'pulo_08';
      else if (state === 'andando') {
        const animation = atlas.animations.andando;
        id = animation.frames[Math.floor(distance/animation.distancePerCycle*animation.frames.length)%animation.frames.length];
      } else {
        const animation = atlas.animations.parado;
        let position = reduced ? 0 : (idleTime*1000)%animation.durations.reduce((sum,value)=>sum+value,0), index = 0;
        while (position >= animation.durations[index] && index < animation.frames.length-1) position -= animation.durations[index++];
        id = animation.frames[index];
      }
      this.element.dataset.animation = state; this.draw(id);
    }
  }
  window.GuardiaoKaiAnimado = GuardiaoKaiAnimado;
})();
