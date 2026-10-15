
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreLabel = document.getElementById("score");
const statusLabel = document.getElementById("status");
const toast = document.getElementById("toast");
const winPanel = document.getElementById("winPanel");

const W = canvas.width;
const H = canvas.height;
const WORLD_WIDTH = 3200;
const GROUND = 455;

const keys = {};
let leftPressed = false;
let rightPressed = false;
let won = false;
let score = 0;
let hasHose = false;
let messageTimer = 0;
let waterTimer = 0;
let winTimer = null;
let lastTime = 0;
let walkFrame = 0;
let walkTimer = 0;

const player = {
  x: 90,
  y: GROUND - 72,
  w: 42,
  h: 72,
  vx: 0,
  vy: 0,
  speed: 235,
  jumpPower: 510,
  onGround: true,
  facing: 1
};

const hose = {
  x: 360,
  y: GROUND - 26,
  w: 44,
  h: 26
};

const fires = [
  { x: 660, active: true, phase: 0 },
  { x: 1030, active: true, phase: 1.4 },
  { x: 1450, active: true, phase: 2.6 }
];

const groundSegments = [
  { x: 0, end: 540 },
  { x: 640, end: 1030 },
  { x: 1140, end: 1580 },
  { x: 1690, end: 2130 },
  { x: 2240, end: 2670 },
  { x: 2780, end: WORLD_WIDTH }
];

const platforms = [
  { x: 300, y: 390, w: 135, h: 18, wood: true },
  { x: 465, y: 330, w: 125, h: 18, wood: true },
  { x: 700, y: 375, w: 145, h: 18 },
  { x: 875, y: 315, w: 135, h: 18, wood: true },
  { x: 1080, y: 385, w: 125, h: 18, wood: true },
  { x: 1280, y: 335, w: 165, h: 18 },
  { x: 1500, y: 385, w: 120, h: 18, wood: true },
  { x: 1790, y: 355, w: 155, h: 18, wood: true },
  { x: 1990, y: 300, w: 145, h: 18 },
  { x: 2320, y: 375, w: 145, h: 18, wood: true },
  { x: 2510, y: 320, w: 160, h: 18 },
  { x: 2820, y: 365, w: 150, h: 18, wood: true }
];

const camera = { x: 0 };

function loadImage(path) {
  const img = new Image();
  img.src = path;
  return img;
}
// Sprites da Flora voando
const floraVoando = [];

for (let i = 1; i <= 8; i++) {
  floraVoando.push(
    loadImage(
      `../assets/personagens/flora_voo_sprites/flora_voando_${String(i).padStart(2, "0")}.png`
    )
  );
}

// Sprite parado do Carlos
const carlosSprite = loadImage(
  "../assets/personagens/carlos_sprites/carlos_sprite_01.png"
);

// Posição do Carlos no cenário
const carlos = {
  x: 190,
  y: GROUND - 78,
  w: 58,
  h: 78
};

// Controle dos diálogos
let dialogoAtual = null;
let linhaDialogo = 0;

const dialogos = {
  carlos: [
    "Olá, Kai! A Amazônia precisa da sua ajuda.",
    "Pegue a mangueira e procure os focos de incêndio.",
    "Chegue perto do fogo e pressione E ou USAR para apagá-lo."
  ],
  flora: [
    "Oi, Kai! Eu sou Flora, a coruja da floresta!",
    "Precisamos proteger os animais e as árvores.",
    "Conte comigo durante sua aventura!"
  ]
};

const blocoTerraGrama = loadImage(
  "../assets/cenarios/tileset_sprites/blocos_terra_grama/blocos_terra_grama_01.png"
);

const kaiIdle = loadImage(
  "../assets/personagens/kai_sprites/parado/kai_parado_01.png"
);


const kaiWalk = [];

for (let i = 1; i <= 8; i++) {
  kaiWalk.push(loadImage(
    `../assets/personagens/kai_sprites/andando/kai_andando_${String(i).padStart(2, "0")}.png`
  ));
}

const kaiJump = [];

for (let i = 1; i <= 6; i++) {
  kaiJump.push(loadImage(
    `../assets/personagens/kai_sprites/salto_sprites/kai_salto_${String(i).padStart(2, "0")}.png`
  ));
}

const firefighterIdleRight = [1, 2, 3].map(i =>
  loadImage(`../assets/personagens/kai_sprites/bombeiro_sprites/parado/direita/bombeiro_parado_direita_${String(i).padStart(2, "0")}.png`)
);

const firefighterIdleLeft = [1, 2, 3].map(i =>
  loadImage(`../assets/personagens/kai_sprites/bombeiro_sprites/parado/esquerda/bombeiro_parado_esquerda_${String(i).padStart(2, "0")}.png`)
);

const firefighterWalkRight = [1, 2, 3, 4].map(i =>
  loadImage(`../assets/personagens/kai_sprites/bombeiro_sprites/andando/direita/bombeiro_andando_direita_${String(i).padStart(2, "0")}.png`)
);

const firefighterWalkLeft = [1, 2, 3, 4].map(i =>
  loadImage(`../assets/personagens/kai_sprites/bombeiro_sprites/andando/esquerda/bombeiro_andando_esquerda_${String(i).padStart(2, "0")}.png`)
);

const firefighterJumpRight = [];

for (let i = 1; i <= 3; i++) {
  firefighterJumpRight.push(loadImage(
    `../assets/personagens/kai_sprites/bombeiro_sprites/pulando/direita/bombeiro_pulando_direita_${String(i).padStart(2, "0")}.png`
  ));
}


const firefighterJumpLeft = [];

for (let i = 1; i <= 3; i++) {
  firefighterJumpLeft.push(loadImage(
    `../assets/personagens/kai_sprites/bombeiro_sprites/pulando/esquerda/bombeiro_pulando_esquerda_${String(i).padStart(2, "0")}.png`
  ));
}


function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2200);
}

function updateHud() {
  scoreLabel.textContent = `Focos apagados: ${score}/3`;
  statusLabel.textContent = won
    ? "Fase concluída!"
    : hasHose
      ? "Mangueira equipada"
      : "Encontre a mangueira!";
}

function resetGame() {
  player.x = 90;
  player.y = GROUND - player.h;
  player.vx = 0;
  player.vy = 0;
  player.facing = 1;
  player.onGround = true;

  clearTimeout(winTimer);
  dialogoAtual = null;
  linhaDialogo = 0;
  camera.x = 0;
  leftPressed = rightPressed = false;
  Object.keys(keys).forEach(key => delete keys[key]);
  hasHose = false;
  won = false;
  score = 0;
  waterTimer = 0;

  fires.forEach(fire => fire.active = true);
  winPanel.hidden = true;

  updateHud();
  showToast("Encontre a mangueira e apague os 3 focos!");
}

function jump() {
  if (player.onGround && !won) {
    player.vy = -player.jumpPower;
    player.onGround = false;
  }
}


function interact() {
  // Se já existe um diálogo, avança a fala
  if (dialogoAtual) {
    linhaDialogo++;

    if (linhaDialogo >= dialogos[dialogoAtual].length) {
      dialogoAtual = null;
      linhaDialogo = 0;
    }

    return;
  }

  if (won) return;

  const center = player.x + player.w / 2;

  // Conversar com Carlos
  const pertoCarlos =
    Math.abs(center - (carlos.x + carlos.w / 2)) < 85 &&
    Math.abs(player.y - carlos.y) < 90;

  if (pertoCarlos) {
    dialogoAtual = "carlos";
    linhaDialogo = 0;
    return;
  }


  // Pegar a mangueira
  if (
    !hasHose &&
    Math.abs(center - (hose.x + hose.w / 2)) < 75
  ) {
    hasHose = true;
    showToast("Você pegou a mangueira!");
    updateHud();
    return;
  }

  if (!hasHose) {
    showToast("Aproxime-se da mangueira primeiro!");
    return;
  }

  // Apagar o incêndio mais próximo
  const nearest = fires
    .filter(f => f.active && Math.abs(center - f.x) < 95)
    .sort(
      (a, b) =>
        Math.abs(center - a.x) - Math.abs(center - b.x)
    )[0];

  if (!nearest) {
    showToast("Chegue mais perto de um incêndio!");
    return;
  }

  nearest.active = false;
  score++;
  waterTimer = 0.55;

  showToast("Boa! Mais um foco apagado.");
  updateHud();

  if (score === fires.length) {
    won = true;
    updateHud();
    winTimer = setTimeout(() => winPanel.hidden = false, 350);
  }
}


function update(dt) {
  if (won) {
    player.vx = 0;
    return;
  }

  let move = 0;

  if (keys.ArrowLeft || keys.a || keys.A || leftPressed) move--;
  if (keys.ArrowRight || keys.d || keys.D || rightPressed) move++;

  player.vx = move * player.speed;

  if (move !== 0) player.facing = Math.sign(move);

  const previousBottom = player.y + player.h;

  player.x += player.vx * dt;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));

  player.vy += 1350 * dt;
  player.y += player.vy * dt;
  player.onGround = false;

  if (player.vy >= 0) {
    for (const segment of groundSegments) {
      const overlaps = player.x + player.w > segment.x &&
        player.x < segment.end;

      const crosses = previousBottom <= GROUND &&
        player.y + player.h >= GROUND;

      if (overlaps && crosses) {
        player.y = GROUND - player.h;
        player.vy = 0;
        player.onGround = true;
        break;
      }
    }

    if (!player.onGround) {
      for (const p of platforms) {
        const overlaps = player.x + player.w > p.x &&
          player.x < p.x + p.w;

        const crosses = previousBottom <= p.y &&
          player.y + player.h >= p.y;

        if (overlaps && crosses) {
          player.y = p.y - player.h;
          player.vy = 0;
          player.onGround = true;
          break;
        }
      }
    }
  }

  if (player.y > H + 100) {
    const safeGround = groundSegments.filter(segment => segment.x <= player.x).at(-1);
    player.x = Math.max(safeGround.x, Math.min(player.x - 120, safeGround.end - player.w));
    player.y = GROUND - player.h;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    showToast("Cuidado com o rio! Tente saltar pelas plataformas.");
  }

  walkTimer += dt;

  if (walkTimer > 0.11) {
    walkTimer = 0;
    walkFrame++;
  }

  waterTimer = Math.max(0, waterTimer - dt);

  camera.x = Math.max(
    0,
    Math.min(WORLD_WIDTH - W, player.x - W * 0.42)
  );
}

function drawDistantMountains() {
  const parallax = camera.x * 0.12;

  // Montanhas distantes
  ctx.fillStyle = "#9ac9a7";
  ctx.beginPath();
  ctx.moveTo(0, 340);

  for (let i = -1; i <= 8; i++) {
    const x = i * 150 - (parallax % 150);
    ctx.lineTo(x + 75, 145 + (i % 3) * 35);
    ctx.lineTo(x + 150, 340);
  }

  ctx.closePath();
  ctx.fill();

  // Montanhas intermediárias
  ctx.fillStyle = "#659b72";
  ctx.beginPath();
  ctx.moveTo(0, 360);

  for (let i = -1; i <= 10; i++) {
    const x = i * 115 - (parallax * 1.5 % 115);
    ctx.lineTo(x + 57, 205 + (i % 4) * 24);
    ctx.lineTo(x + 115, 360);
  }

  ctx.closePath();
  ctx.fill();
}

function drawTree(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "#765333";
  ctx.fillRect(-9, -45, 18, 55);

  ctx.fillStyle = "#267247";
  ctx.beginPath();
  ctx.arc(0, -62, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#318a4d";
  ctx.beginPath();
  ctx.arc(-17, -73, 23, 0, Math.PI * 2);
  ctx.arc(17, -75, 24, 0, Math.PI * 2);
  ctx.fill();

  // Folhas grandes na copa
  ctx.fillStyle = "#3b9954";
  ctx.beginPath();
  ctx.ellipse(-22, -67, 18, 28, -0.5, 0, Math.PI * 2);
  ctx.ellipse(21, -69, 20, 29, 0.5, 0, Math.PI * 2);
  ctx.ellipse(0, -91, 17, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cipós pendurados
  ctx.strokeStyle = "#286e3c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-22, -90);
  ctx.quadraticCurveTo(-35, -65, -27, -43);
  ctx.moveTo(24, -86);
  ctx.quadraticCurveTo(35, -60, 29, -35);
  ctx.stroke();

  // Pequenas folhas nos cipós
  ctx.fillStyle = "#70bd50";
  ctx.beginPath();
  ctx.ellipse(-31, -61, 7, 3, -0.5, 0, Math.PI * 2);
  ctx.ellipse(32, -54, 7, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
const cenario1 = new Image();
cenario1.src = "../assets/cenarios/cenario1.png";

function drawBackground() {
  // Céu provisório enquanto a imagem carrega
  ctx.fillStyle = "#70c8f5";
  ctx.fillRect(0, 0, W, H);

  // Desenha o cenário panorâmico
  if (cenario1.complete && cenario1.naturalWidth > 0) {
    const proporcao = H / cenario1.height;
    const largura = cenario1.width * proporcao;
    const larguraCenario = Math.max(largura, WORLD_WIDTH);
    const deslocamento = camera.x * 0.35;

    ctx.drawImage(
      cenario1,
      -deslocamento,
      0,
      larguraCenario,
      H
    );




  }
}
function drawTerrain() {

  // Rio
  ctx.fillStyle = "#168fc1";
  ctx.fillRect(0, GROUND + 15, W, H - GROUND - 15);

  ctx.fillStyle = "#45d1e5";
  for (let i = 0; i < 34; i++) {
    const x = i * 97 - (camera.x * 0.85 % 97);
    const y = GROUND + 35 + (i % 4) * 25;
    ctx.fillRect(x, y, 34 + (i % 3) * 10, 3);
  }

  // Chão

  for (const s of groundSegments) {

    const x = s.x - camera.x;
    const width = s.end - s.x;
    if (x > W || x + width < 0) continue;

    // Base de terra
    ctx.fillStyle = "#6e492d";
    ctx.fillRect(x, GROUND, width, H - GROUND);

    // Sprite de terra e grama
    const tamanhoBloco = 32;

    if (blocoTerraGrama.complete &&
      blocoTerraGrama.naturalWidth > 0) {
      for (let j = 0; j < width; j += tamanhoBloco) {
        const largura = Math.min(tamanhoBloco, width - j);

        ctx.drawImage(
          blocoTerraGrama,
          x + j,
          GROUND,
          largura,
          tamanhoBloco
        );
      }
    } else {
      // Grama provisória caso a imagem não carregue
      ctx.fillStyle = "#4c8f3c";
      ctx.fillRect(x, GROUND, width, 13);
    }
  }


  // Plataformas de madeira e pedra
  for (const p of platforms) {
    const x = p.x - camera.x;
    if (x > W || x + p.w < 0) continue;

    ctx.fillStyle = p.wood ? "#76502e" : "#786d50";
    ctx.fillRect(x, p.y, p.w, p.h);

    ctx.fillStyle = p.wood ? "#b77b3f" : "#6fa64c";
    ctx.fillRect(x, p.y - 3, p.w, 7);

    ctx.strokeStyle = "#4a3423";
    ctx.lineWidth = 2;

    if (p.wood) {
      for (let j = 15; j < p.w; j += 28) {
        ctx.beginPath();
        ctx.moveTo(x + j, p.y);
        ctx.lineTo(x + j, p.y + p.h);
        ctx.stroke();
      }
    }
  }
}

function drawHose() {
  if (hasHose) return;

  const x = hose.x - camera.x;

  ctx.strokeStyle = "#e7c84d";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(x, hose.y + 17);
  ctx.quadraticCurveTo(x + 18, hose.y - 3, x + 28, hose.y + 17);
  ctx.stroke();

  ctx.fillStyle = "#6c8792";
  ctx.fillRect(x + 29, hose.y + 9, 15, 9);
}

function drawFire(fire) {
  if (!fire.active) return;

  const x = fire.x - camera.x;
  if (x < -70 || x > W + 70) return;

  const t = performance.now() / 170 + fire.phase;

  ctx.fillStyle = "#777a7b";
  ctx.globalAlpha = 0.5;

  ctx.beginPath();
  ctx.arc(x - 12, GROUND - 63 - Math.sin(t) * 5, 16, 0, Math.PI * 2);
  ctx.arc(x + 10, GROUND - 78 - Math.cos(t) * 5, 19, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#e94b22";

  ctx.beginPath();
  ctx.moveTo(x - 25, GROUND - 8);
  ctx.quadraticCurveTo(x - 33, GROUND - 39, x - 8, GROUND - 54 - Math.sin(t) * 5);
  ctx.quadraticCurveTo(x - 4, GROUND - 34, x + 4, GROUND - 24);
  ctx.quadraticCurveTo(x + 9, GROUND - 63, x + 23, GROUND - 49);
  ctx.quadraticCurveTo(x + 37, GROUND - 18, x + 20, GROUND - 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffbd38";
  ctx.beginPath();
  ctx.moveTo(x - 12, GROUND - 8);
  ctx.quadraticCurveTo(x - 10, GROUND - 31, x + 1, GROUND - 39);
  ctx.quadraticCurveTo(x + 2, GROUND - 20, x + 14, GROUND - 8);
  ctx.fill();
}
// Animação da Flora
let floraFrame = 0;
let floraUltimaAnimacao = 0;

function drawCarlos() {
  if (
    !carlosSprite.complete ||
    carlosSprite.naturalWidth === 0
  ) {
    return;
  }

  const x = carlos.x - camera.x;

  // Não desenha se estiver fora da tela
  if (x < -carlos.w || x > W) return;

  ctx.drawImage(
    carlosSprite,
    x,
    carlos.y,
    carlos.w,
    carlos.h
  );

  // Identificação do NPC
  ctx.fillStyle = "#173b2b";
  ctx.fillRect(x - 5, carlos.y - 23, 68, 20);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px system-ui";
  ctx.fillText("CARLOS", x + 4, carlos.y - 9);
}

function drawFlora(timestamp) {
  if (floraVoando.length === 0) return;

  // Troca o quadro da animação a cada 120 ms
  if (timestamp - floraUltimaAnimacao > 120) {
    floraFrame = (floraFrame + 1) % floraVoando.length;
    floraUltimaAnimacao = timestamp;
  }

  const img = floraVoando[floraFrame];

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const largura = 100;
  const altura = 75;

  // Posição inicial da Flora na tela
  // Flora acompanha o Kai pelo cenário
  const x = player.x - camera.x + 100;
  const y = 150 + Math.sin(timestamp / 300) * 12;
  ctx.drawImage(img, x, y, largura, altura);
}
function drawPlayer() {
  const x = player.x - camera.x;
  const y = player.y;
  const moving = Math.abs(player.vx) > 5;
  const jumping = !player.onGround;

  let img = null;

  // Escolhe a animação do personagem.
  if (hasHose) {
    if (jumping) {
      const arr = player.facing === 1
        ? firefighterJumpRight
        : firefighterJumpLeft;

      if (arr.length > 0) {
        img = arr[Math.floor(walkFrame / 2) % arr.length];
      }
    } else {
      const arr = moving
        ? (player.facing === 1
          ? firefighterWalkRight
          : firefighterWalkLeft)
        : (player.facing === 1
          ? firefighterIdleRight
          : firefighterIdleLeft);

      img = moving
        ? arr[walkFrame % arr.length]
        : arr[0];
    }
  } else if (jumping && kaiJump.length > 0) {
    img = kaiJump[
      Math.floor(walkFrame / 2) % kaiJump.length
    ];
  } else {
    img = moving
      ? kaiWalk[walkFrame % kaiWalk.length]
      : kaiIdle;
  }

  // Desenha o personagem.
  if (img && img.complete && img.naturalWidth > 0) {
    const drawH = 78;
    const drawW = drawH * img.naturalWidth / img.naturalHeight;
    const drawX = x + player.w / 2 - drawW / 2;
    const drawY = y + player.h - drawH;

    // O Kai normal é espelhado para a esquerda.
    // O bombeiro já possui sprites específicos para cada lado.
    if (!hasHose && player.facing === -1) {
      ctx.save();
      ctx.translate(drawX + drawW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, drawY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
  } else {
    // Personagem provisório caso a imagem não carregue.
    ctx.fillStyle = hasHose ? "#d9a44a" : "#3d8a4b";
    ctx.fillRect(x + 7, y + 24, 28, 31);

    ctx.fillStyle = "#c98c5d";
    ctx.beginPath();
    ctx.arc(x + 21, y + 15, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e8d3a1";
    ctx.fillRect(x + 8, y + 52, 11, 20);
    ctx.fillRect(x + 23, y + 52, 11, 20);
  }

  // Efeito do jato de água.
  if (waterTimer > 0 && hasHose) {
    const direction = player.facing;
    const t = performance.now() / 100;

    const startX = x + player.w / 2 + direction * 20;
    const startY = y + 36;

    ctx.save();
    ctx.lineCap = "round";

    ctx.strokeStyle = "#d9f8ff";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + direction * 76, startY - 10);
    ctx.stroke();

    ctx.strokeStyle = "#55cfff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + direction * 76, startY - 10);
    ctx.stroke();

    for (let i = 0; i < 7; i++) {
      const progress = (t + i * 0.17) % 1;
      const dropX = startX + direction * (12 + progress * 68);
      const dropY = startY - progress * 10
        + Math.sin(t * 2 + i) * 4;

      ctx.fillStyle = i % 2 === 0 ? "#e8fbff" : "#55cfff";
      ctx.beginPath();
      ctx.arc(dropX, dropY, 2 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}


function drawDialogo() {
  if (!dialogoAtual) return;

  const falas = dialogos[dialogoAtual];
  if (!falas) return;

  const texto = falas[linhaDialogo];

  const boxX = 35;
  const boxY = H - 115;
  const boxW = W - 70;
  const boxH = 88;

  ctx.fillStyle = "rgba(15, 35, 25, 0.94)";
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.strokeStyle = "#9acb65";
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = "#c9f28b";
  ctx.font = "bold 16px system-ui";
  ctx.fillText(
    dialogoAtual === "carlos" ? "Carlos" : "Flora",
    boxX + 15,
    boxY + 25
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "15px system-ui";
  ctx.fillText(texto, boxX + 15, boxY + 49, boxW - 30);

  ctx.fillStyle = "#ffe58f";
  ctx.font = "12px system-ui";
  ctx.fillText(
    "ENTER para continuar",
    boxX + 15,
    boxY + 73
  );
}


function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawTerrain();
  drawCarlos();
  drawFlora(performance.now());
  fires.forEach(drawFire);
  drawHose();
  drawPlayer();

  ctx.fillStyle = "#173b2b";
  ctx.globalAlpha = 0.9;
  ctx.fillRect(18, 16, 222, 38);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#f5ffe7";
  ctx.font = "bold 15px system-ui";
  ctx.fillText("AMAZÔNIA EM CHAMAS", 31, 40);

  if (hasHose) {
    ctx.fillStyle = "#173b2b";
    ctx.fillRect(756, 16, 184, 38);

    ctx.fillStyle = "#ffe58f";
    ctx.fillText("MANGUEIRA EQUIPADA", 770, 40);
  }
  drawDialogo();
}

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.033);
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}


document.addEventListener("keydown", event => {
  keys[event.key] = true;

  if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) {
    event.preventDefault();
  }

  if (["f", "F"].includes(event.key) && !event.repeat && !won) talkToFlora();

  // Pular
  if (
    event.key === " " ||
    event.key === "ArrowUp" ||
    event.key === "w"
  ) {
    jump();
  }

  // Interagir com Carlos, Flora e os objetos usando Enter
  if (["Enter", "e", "E"].includes(event.key) && !event.repeat) {
    event.preventDefault();
    interact();
  }
});


document.addEventListener("keyup", event => {
  keys[event.key] = false;
});

function talkToFlora() {
  if (won) return;
  if (dialogoAtual) { interact(); return; }
  dialogoAtual = "flora";
  linhaDialogo = 0;
}

window.addEventListener("blur", () => {
  Object.keys(keys).forEach(key => delete keys[key]);
  leftPressed = rightPressed = false;
});

function bindHoldButton(id, callback, release) {
  const button = document.getElementById(id);
  if (!button) return;

  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    callback();
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach(type => {
    button.addEventListener(type, event => {
      event.preventDefault();
      if (release) release();
    });
  });
}

bindHoldButton("leftButton", () => leftPressed = true, () => leftPressed = false);
bindHoldButton("rightButton", () => rightPressed = true, () => rightPressed = false);
bindHoldButton("jumpButton", jump);
bindHoldButton("useButton", interact);
bindHoldButton("floraButton", talkToFlora);

const restartButton = document.getElementById("restartButton");
if (restartButton) restartButton.addEventListener("click", resetGame);

updateHud();
showToast("Encontre a mangueira e apague os 3 focos!");
requestAnimationFrame(loop);
