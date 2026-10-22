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
