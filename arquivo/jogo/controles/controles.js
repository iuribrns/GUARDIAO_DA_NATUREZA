'use strict';
(() => {
  const assets = new URL('../../assets/', document.currentScript.src);
  class GuardiaoControles {
    constructor(root) {
      this.root = root; this.pointer = null; this.jumpPointer = null; this.keys = new Set();
      this.abort = new AbortController();
      root.classList.add('mobile-controls');
      root.innerHTML = '<div class="joystick" tabindex="0" role="slider" aria-label="Joystick para mover Kai" aria-valuemin="-100" aria-valuemax="100" aria-valuenow="0" aria-valuetext="Parado" aria-orientation="horizontal"><span class="joystick-axis" aria-hidden="true"></span><span class="joystick-knob" aria-hidden="true"></span><span class="control-caption" aria-hidden="true">MOVER</span></div><div class="mobile-actions"><button type="button" class="control-use" aria-label="Usar equipamento ou interagir"><span aria-hidden="true">✦</span><small>USAR</small></button><button type="button" class="control-jump" aria-label="Pular com Kai"><img src="' + new URL('interface/kai-pulando.png', assets).href + '" alt="" width="1233" height="1275" draggable="false"><small>PULAR</small></button></div>';
      this.pad = root.querySelector('.joystick'); this.knob = root.querySelector('.joystick-knob');
      this.jump = root.querySelector('.control-jump'); this.use = root.querySelector('.control-use');
      const listen = (node, type, callback) => node.addEventListener(type, callback, { signal:this.abort.signal });
      listen(this.pad,'pointerdown',event => {
        if (this.pointer !== null || event.button !== 0) return;
        event.preventDefault(); this.pad.focus({preventScroll:true}); this.pointer = event.pointerId;
        this.pad.setPointerCapture(event.pointerId); this.pad.classList.add('is-held'); this.movePointer(event);
      });
      listen(this.pad,'pointermove',event => { if (event.pointerId === this.pointer) { event.preventDefault(); this.movePointer(event); } });
      for (const type of ['pointerup','pointercancel','lostpointercapture']) listen(this.pad,type,event => { if (event.pointerId === this.pointer) this.releaseStick(); });
      listen(this.jump,'pointerdown',event => {
        if (event.button !== 0 || this.jumpPointer !== null) return;
        event.preventDefault(); this.jumpPointer = event.pointerId; this.jump.setPointerCapture(event.pointerId);
        this.jump.classList.add('is-held'); this.emit('pular');
      });
      for (const type of ['pointerup','pointercancel','lostpointercapture']) listen(this.jump,type,event => {
        if (event.pointerId !== this.jumpPointer) return;
        this.jumpPointer = null; this.jump.classList.remove('is-held'); this.emit('soltar-pulo');
      });
      listen(this.jump,'click',event => { if (event.detail === 0) this.emit('pular'); });
      listen(this.use,'click',() => this.emit('usar'));
      listen(root,'keydown',event => {
        if (['ArrowLeft','ArrowRight','a','A','d','D'].includes(event.key)) {
          event.preventDefault(); this.keys.add(event.key.toLowerCase()); this.moveKeyboard();
        } else if ((event.key === ' ' || event.key === 'ArrowUp') && event.target === this.pad) {
          event.preventDefault(); if (!event.repeat) this.emit('pular');
        }
      });
      listen(window,'keyup',event => { if (this.keys.delete(event.key.toLowerCase())) { event.preventDefault(); this.moveKeyboard(); } });
      listen(root,'focusout',event => { if (!root.contains(event.relatedTarget)) { this.keys.clear(); if (this.pointer === null) this.setMove(0,0); } });
      listen(window,'blur',() => this.reset()); listen(window,'pagehide',() => this.reset());
      listen(document,'visibilitychange',() => { if (document.hidden) this.reset(); });
      root.dataset.controlsReady = 'true';
    }
    emit(type, detail = {}) { this.root.dispatchEvent(new CustomEvent('guardiao:controle',{bubbles:true,detail:{tipo:type,...detail}})); }
    setMove(x, y) {
      const radius = this.pad.clientWidth * .29;
      this.knob.style.transform = 'translate(' + x*radius + 'px,' + y*radius + 'px)';
      this.pad.setAttribute('aria-valuenow',String(Math.round(x*100)));
      this.pad.setAttribute('aria-valuetext',x < -.1 ? 'Esquerda' : x > .1 ? 'Direita' : 'Parado');
      this.emit('mover',{x,y});
    }
    movePointer(event) {
      const rect = this.pad.getBoundingClientRect(), radius = rect.width * .29;
      let x = (event.clientX - rect.left - rect.width/2) / radius;
      let y = (event.clientY - rect.top - rect.height/2) / radius;
      const length = Math.hypot(x,y);
      if (length < .12) x = y = 0;
      else if (length > 1) { x /= length; y /= length; }
      this.setMove(x,y);
    }
    moveKeyboard() {
      const left = this.keys.has('a') || this.keys.has('arrowleft');
      const right = this.keys.has('d') || this.keys.has('arrowright');
      this.setMove(Number(right)-Number(left),0);
    }
    releaseStick() {
      const pointer = this.pointer; this.pointer = null;
      if (pointer !== null && this.pad.hasPointerCapture(pointer)) this.pad.releasePointerCapture(pointer);
      this.pad.classList.remove('is-held'); this.keys.clear(); this.setMove(0,0);
    }
    reset() {
      this.releaseStick();
      if (this.jumpPointer !== null && this.jump.hasPointerCapture(this.jumpPointer)) this.jump.releasePointerCapture(this.jumpPointer);
      this.jumpPointer = null; this.jump.classList.remove('is-held'); this.emit('soltar-pulo');
    }
    destroy() { this.reset(); this.abort.abort(); this.root.replaceChildren(); delete this.root.dataset.controlsReady; }
  }
  window.GuardiaoControles = GuardiaoControles;
  document.querySelectorAll('[data-guardiao-controles]').forEach(root => { root.controlesGuardiao = new GuardiaoControles(root); });
})();
