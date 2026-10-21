import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
for (const name of ['phaser', 'gsap', 'vite', 'playwright-core']) {
  const info = JSON.parse(await readFile(resolve(root, 'node_modules', name, 'package.json'), 'utf8'));
  console.log(`${name}: ${info.version}`);
}
console.log(`Node.js: ${process.version}`);
const tools = process.env.GUARDIAO_TOOLS_DIR || '/workspace/.tools/guardiao';
for (const name of ['tiled', 'libresprite']) {
  const executable = resolve(tools, 'bin', name);
  if (!existsSync(executable)) throw new Error(`${name} não está instalado. Execute npm run tools:install.`);
  const text = execFileSync(executable, ['--version'], { encoding: 'utf8' });
  console.log(text.trim().split('\n')[0]);
}
