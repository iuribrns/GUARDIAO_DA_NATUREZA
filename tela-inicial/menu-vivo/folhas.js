'use strict';
(() => {
  // Recortes da arte enviada: as folhas não estão todas dentro de células iguais.
  const frames = [[99,87,266,319],[538,98,300,312],[1091,66,113,360],[1425,133,275,250],[92,489,276,343],[471,578,444,185],[989,495,287,337],[1490,546,186,261]];
  let generation = 0;
  function prepare(layer, { compact = false } = {}) {
    if (!layer || layer.hidden) return;
    const fragment = document.createDocumentFragment();
    const count = compact ? 12 : 20;
    generation++;
    for (let index = 0; index < count; index++) {
      const frame = frames[index % frames.length];
      const leaf = document.createElement('span'); leaf.className = 'leaf-particle living-leaf';
      const fall = 12 + Math.random() * 10;
      const size = (compact ? 32 : 42) + Math.random() * (compact ? 20 : 30);
      const properties = {
        '--size': size + 'px', '--duration': fall + 's', '--delay': (-fall * (index + .7) / count) + 's',
        '--drift': (45 + Math.random() * 130) + 'px', '--sway': (12 + Math.random() * 26) + 'px',
        '--sway-time': (2.6 + Math.random() * 2.8) + 's', '--turn': (Math.random() * 100 - 50) + 'deg',
        '--leaf-opacity': (.58 + Math.random() * .3).toFixed(2)
      };
      leaf.style.left = (-12 + index / count * 106) + '%';
      for (const [key,value] of Object.entries(properties)) leaf.style.setProperty(key,value);
      const id = 'leaf-frame-' + generation + '-' + index;
      leaf.innerHTML = '<span class="leaf-sway"><span class="leaf-turn"><svg viewBox="' + frame.join(' ') + '" xmlns="http://www.w3.org/2000/svg" focusable="false"><defs><clipPath id="' + id + '"><rect x="' + frame[0] + '" y="' + frame[1] + '" width="' + frame[2] + '" height="' + frame[3] + '"/></clipPath></defs><image href="assets/folhas-sprites.png" width="1774" height="887" clip-path="url(#' + id + ')"/></svg></span></span>';
      fragment.append(leaf);
    }
    layer.classList.add('living-leaves'); layer.replaceChildren(fragment);
  }
  window.GuardiaoFolhas = Object.freeze({ preparar: prepare });
})();
