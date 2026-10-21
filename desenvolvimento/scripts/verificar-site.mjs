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
console.log('PASS: '+count+' páginas, entrada direta do jogo, caminhos relativos, controles e arte do pulo presentes, sem dependências ou dados Git no site.');
