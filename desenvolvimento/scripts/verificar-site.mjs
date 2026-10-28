import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';

const root = resolve('dist');
const entry = readFileSync(resolve(root,'index.html'),'utf8');
assert.match(entry,/tela-inicial\/nova-versao\/index\.html/,'a raiz abre o jogo');
assert.ok(existsSync(resolve(root,'.nojekyll')));
for (const path of ['node_modules','.git','.github','.cache']) assert.ok(!existsSync(resolve(root,path)),path+' não deve ser publicado');
let count = 0;
function check(folder) {
  for (const item of readdirSync(folder,{withFileTypes:true})) {
    const path = resolve(folder,item.name);
    if (item.isDirectory()) { check(path); continue; }
    if (!/\.html$/.test(item.name)) continue;
    count++;
    const html = readFileSync(path,'utf8');
    for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) {
      const url = match[1];
      if (/^(?:[a-z]+:|#|\/\/)/i.test(url)) continue;
      assert.ok(!url.startsWith('/'),'caminho absoluto quebra Pages em subpasta: '+url);
      const target = resolve(dirname(path),decodeURIComponent(url.split(/[?#]/)[0]));
      assert.ok(!relative(root,target).startsWith('..'),'referência fora do site: '+url);
      assert.ok(existsSync(target),relative(root,path)+' referencia arquivo ausente: '+url);
    }
  }
}
check(root);
assert.ok(existsSync(resolve(root,'assets/interface/kai-pulando.png')));
assert.ok(existsSync(resolve(root,'jogo/controles/controles.js')));
const kaiFolder=resolve(root,'assets/personagens/kai/animacoes');
const atlas=JSON.parse(readFileSync(resolve(kaiFolder,'atlas.json'),'utf8'));
for(const image of Object.values(atlas.images)) assert.ok(existsSync(resolve(kaiFolder,image.file)),'prancha de Kai presente: '+image.file);
console.log('PASS: '+Object.keys(atlas.frames).length+' quadros de Kai, '+count+' páginas, entrada direta do jogo, caminhos relativos, controles e arte do pulo presentes, sem dependências ou dados Git no site.');

const forestFolder=resolve(root,'jogo/floresta-viva/assets');
const forestAtlas=JSON.parse(readFileSync(resolve(forestFolder,'atlas.json'),'utf8'));
let forestFrames=0;
for(const sheet of Object.values(forestAtlas.sheets)){assert.ok(existsSync(resolve(forestFolder,sheet.file)),'prancha da floresta presente: '+sheet.file);forestFrames+=sheet.frames.length;}
assert.equal(forestFrames,108);
for(const file of ['floresta-queimada.png','floresta-recuperada.png'])assert.ok(existsSync(resolve(forestFolder,file)));
console.log('PASS: floresta nova com 108 quadros, cenários queimado/recuperado e entrada pelo mapa.');

const revisedFolder=resolve(root,'jogo/floresta-viva/revisao');
const revisedAtlas=JSON.parse(readFileSync(resolve(revisedFolder,'assets/atlas-revisado.json'),'utf8'));
assert.equal(Object.values(revisedAtlas).reduce((n,s)=>n+s.frames.length,0),128);
for(const sheet of Object.values(revisedAtlas))assert.ok(existsSync(resolve(forestFolder,sheet.file)),'prancha revisada: '+sheet.file);
for(const file of ['ilha-viva.png','ilha-restaurada.png','festa-da-floresta.png','kai-cuida-da-natureza.png'])assert.ok(existsSync(resolve(root,'tela-inicial/jornada-viva/assets',file)));
console.log('PASS: 128 quadros remodelados, duas pinturas da floresta e nova ilha, imagens do diário e da conclusão.');

const campaign=JSON.parse(readFileSync(resolve(root,'jogo/jornada/assets/atlas.json'),'utf8'));
assert.equal(Object.values(campaign).reduce((n,s)=>n+s.frames.length,0),198);
for(const sheet of Object.values(campaign))assert.ok(existsSync(resolve(root,'jogo/jornada',sheet.file)),'arte da campanha: '+sheet.file);
for(const map of ['rio','fauna','plantio','cidade'])for(const suffix of ['','-restaurado'])assert.ok(existsSync(resolve(root,`jogo/jornada/assets/mapa-${map}${suffix}.png`)));
const manifest=JSON.parse(readFileSync(resolve(root,'jogo/sistemas/arte-manifesto.js'),'utf8').replace(/^window.GuardiaoArteManifesto=/,'').replace(/;\s*$/,''));
for(const [original,optimized] of Object.entries(manifest)){assert.ok(existsSync(resolve(root,original)));assert.ok(existsSync(resolve(root,optimized)));}
const selection=readFileSync(resolve(root,'tela-inicial/nova-versao/aventura.html'),'utf8');assert.ok(!selection.includes('data-map-action="preview"'));
assert.ok(selection.includes('../campanha/mapa.js'));
console.log('PASS: campanha de cinco fases, 198 quadros compartilhados/novos, oito pinturas próprias e '+Object.keys(manifest).length+' imagens WebP, originais preservados e seleção sem prévias.');

const completeSpritesFolder=resolve(root,'jogo/sprites-integros');
const completeSprites=JSON.parse(readFileSync(resolve(completeSpritesFolder,'assets/atlas.json'),'utf8'));
const completeSheets=[...Object.values(completeSprites.grupos).flatMap(group=>Object.values(group)),completeSprites.colar];
assert.equal(completeSheets.length,24);
assert.equal(completeSheets.reduce((n,s)=>n+s.frames.length,0),330);
for(const sheet of completeSheets)assert.ok(existsSync(resolve(completeSpritesFolder,sheet.file)),'prancha completa: '+sheet.file);
for(const file of ['colar.js','colar.css','geometria.js','assets/colar-vazio.webp'])assert.ok(existsSync(resolve(root,'jogo/colar-vivo',file)),'cutscene do colar: '+file);
console.log('PASS: 330 quadros completos em 24 WebP, oito poses de Kai vestindo o colar e arte/estilos da cutscene publicados.');

const waterFolder=resolve(root,'jogo/agua-viva');
const waterAtlas=JSON.parse(readFileSync(resolve(waterFolder,'assets/atlas.json'),'utf8'));
assert.equal(waterAtlas.streams.length,8);
assert.equal(waterAtlas.splashes.length,8);
assert.equal(waterAtlas.anchors.idle.length,16);
assert.equal(waterAtlas.anchors.walk.length,32);
assert.ok(existsSync(resolve(waterFolder,waterAtlas.file)));
console.log('PASS: água da mangueira com oito jatos, oito impactos e 48 engates de bico publicados.');
