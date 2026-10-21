'use strict';
(() => {
  const stage = document.querySelector('.map-stage');
  const restoredArt = document.querySelector('.map-restored');
  const revisitMarker = document.querySelector('.map-revisit');
  const dialog = document.getElementById('phase-dialog');
  const status = document.getElementById('map-status');
  const storageKey = 'guardiao.mapa.progresso.v1';
  const phases = window.GuardiaoFases.map(phase => ({ ...phase, name: phase.nome.toLocaleLowerCase('pt-BR').replace(/(^|\s)\S/g, letter => letter.toLocaleUpperCase('pt-BR')).replace(/\b(Em|Da|Do|De|Das|Dos)\b/g, word => word.toLowerCase()), objective: phase.situacao }));
  let progress = { completedFirst: false, current: 1 };
  let preview = null;
  let busy = false;
  let finishAnimation;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved?.completedFirst === true) progress = { completedFirst: true, current: saved.current === 1 ? 1 : 2 };
  } catch { /* O mapa também funciona sem armazenamento. */ }

  const state = () => preview || progress;
  const unlocked = (phase, value = state()) => phase === 1 || (phase === 2 && value.completedFirst);
  function announce(message, error = false) {
    status.textContent = message;
    if (error) {
      document.querySelector('.map-error')?.remove();
      const notice = document.createElement('p'); notice.className = 'map-error'; notice.setAttribute('role', 'alert');
      notice.textContent = message; document.body.append(notice); setTimeout(() => notice.remove(), 6500);
    }
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); return true; }
    catch { announce('O progresso foi aplicado nesta aba. O navegador não permitiu salvá-lo.', true); return false; }
  }
  function render({ instant = false } = {}) {
    if (instant) stage.classList.add('no-animation');
    const current = state();
    stage.classList.toggle('is-restored', current.completedFirst);
    stage.dataset.currentPhase = current.current;
    revisitMarker.toggleAttribute('hidden', !current.completedFirst || current.current !== 1);
    document.querySelectorAll('[data-phase]').forEach(button => {
      const phase = Number(button.dataset.phase);
      const available = unlocked(phase);
      const completed = phase === 1 && current.completedFirst;
      const label = !available ? 'Bloqueada' : current.current === phase ? (completed ? 'Fase atual · concluída' : 'Fase atual') : completed ? 'Concluída' : 'Disponível';
      button.setAttribute('aria-label', `Fase ${phase}: ${phases[phase - 1].name}. ${label}.`);
      button.removeAttribute('aria-disabled');
      button.dataset.locked = String(!available);
      if (current.current === phase) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
      const caption = button.querySelector('[data-phase-state]'); if (caption) caption.textContent = label;
    });
    if (instant) { void stage.offsetWidth; stage.classList.remove('no-animation'); }
    document.dispatchEvent(new CustomEvent('guardiao:mapa-atualizado', { detail: { ...current, preview: preview !== null } }));
  }
  function getProgress() {
    return { completedFirst: progress.completedFirst, current: progress.current, preview: preview !== null };
  }
  function selectPhase(phase) {
    if (!Number.isInteger(phase) || !unlocked(phase)) throw new RangeError('Esta fase ainda está bloqueada.');
    if (busy) throw new Error('Aguarde a recuperação do mapa.');
    if (preview) preview.current = phase;
    else if (progress.current !== phase) { progress.current = phase; save(); }
    render();
    announce(`Kai está na fase ${phase}: ${phases[phase - 1].name}.`);
    return getProgress();
  }
  function openPhase(phase) {
    if (busy) return;
    const available = unlocked(phase);
    if (available) selectPhase(phase);
    document.getElementById('phase-number').textContent = `FASE ${phase} DE 6`;
    document.getElementById('phase-title').textContent = phases[phase - 1].name;
    document.getElementById('phase-objective').textContent = phases[phase - 1].objective;
    document.getElementById('phase-state').textContent = !available
      ? `Conclua a fase ${phase - 1} para liberar esta região.`
      : preview
        ? 'Prévia do mapa. As fases jogáveis estão em desenvolvimento.'
        : phase === 1 && progress.completedFirst
          ? 'Floresta recuperada. Você pode revisitar esta região quando a fase jogável estiver disponível.'
          : 'Fase em desenvolvimento. O mapa e a prévia da recuperação já estão disponíveis.';
    document.querySelector('[data-map-action="preview"]').hidden = phase !== 1;
    document.querySelector('[data-map-action="exit-preview"]').hidden = preview === null;
    window.GuardiaoPaineis.abrir({ ...phases[phase - 1], available, preview: preview !== null });
  }
  function waitForRestoration() {
    return new Promise(resolve => {
      let finished = false;
      const done = () => {
        if (finished) return; finished = true;
        clearTimeout(timer); restoredArt.removeEventListener('transitionend', onEnd);
        finishAnimation = null; resolve();
      };
      const onEnd = event => { if (event.target === restoredArt && event.propertyName === 'opacity') done(); };
      const timer = setTimeout(done, 1900);
      finishAnimation = done;
      restoredArt.addEventListener('transitionend', onEnd);
    });
  }
  async function restoreForest({ demonstration = false } = {}) {
    if (busy) throw new Error('Aguarde a recuperação do mapa.');
    if (!demonstration && progress.completedFirst) { preview = null; render({ instant: true }); return getProgress(); }
    busy = true; stage.setAttribute('aria-busy', 'true');
    if (dialog.open) dialog.close();
    try {
      // Não avança nem salva progresso se a arte de destino estiver indisponível.
      await restoredArt.decode();
      if (demonstration) preview = { completedFirst: false, current: 1 };
      else preview = null;
      render({ instant: true });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const animation = waitForRestoration();
      stage.classList.add('is-restored');
      await animation;
      const next = { completedFirst: true, current: 2 };
      let persisted = true;
      if (demonstration) preview = next;
      else { progress = next; persisted = save(); }
      render();
      if (demonstration || persisted) announce(demonstration
        ? 'Prévia: a floresta ficou verde e Kai passou para o Rio Poluído. Nenhuma missão foi registrada como concluída.'
        : 'Floresta recuperada! Rio Poluído liberado. Progresso salvo neste navegador.');
      return getProgress();
    } catch (error) {
      render({ instant: true });
      announce('Não foi possível carregar a floresta restaurada. Tente novamente quando a imagem estiver disponível.', true);
      throw error;
    } finally {
      busy = false; stage.removeAttribute('aria-busy');
    }
  }
  function exitPreview() {
    if (busy) return;
    preview = null; render({ instant: true });
    announce('Prévia encerrada. Seu progresso salvo foi restaurado.');
  }
  document.addEventListener('click', event => {
    const phaseButton = event.target.closest('button[data-phase]');
    if (phaseButton) { openPhase(Number(phaseButton.dataset.phase)); return; }
    const action = event.target.closest('[data-map-action]')?.dataset.mapAction;
    if (action === 'close') window.GuardiaoPaineis.fechar();
    if (action === 'preview') restoreForest({ demonstration: true }).catch(() => {});
    if (action === 'exit-preview') { exitPreview(); dialog.close(); }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) window.GuardiaoPaineis.fechar();
  });
  window.addEventListener('pagehide', () => finishAnimation?.());
  // Integração para a futura fase jogável. A prévia não chama esta conclusão.
  window.GuardiaoMapa = Object.freeze({
    obterProgresso: getProgress,
    selecionarFase: selectPhase,
    sairDaPrevia: exitPreview,
    concluirFase: phase => phase === 1
      ? restoreForest()
      : Promise.reject(new RangeError('A recuperação visual disponível neste pacote é a da fase 1.'))
  });
  render({ instant: true });
  announce(`Kai está na fase ${state().current}: ${phases[state().current - 1].name}.`);
})();
