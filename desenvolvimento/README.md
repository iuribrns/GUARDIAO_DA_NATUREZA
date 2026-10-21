# Ferramentas de desenvolvimento

Esta pasta permite instalar, testar e iniciar o trabalho nas fases sem reescrever as telas já aprovadas.

## Organização

- `vite.config.mjs`: servidor e compilação. A raiz redireciona ao menu existente. A compilação gera `dist/`, copia as pastas públicas e compila somente o laboratório com suas dependências.
- `laboratorio/`: teste de Phaser e GSAP usando a folha original de Kai com a mangueira. Não representa uma nova fase e não grava progresso.
- `modelos/mapa-base.tmj`: mapa inicial do Tiled, com grade 32×32 e pontos de entrada/saída. Acrescente tilesets e os elementos da fase antes de usá-lo no gameplay.
- `editores.json`: versões, URLs oficiais e SHA-256 publicados dos dois editores.
- `scripts/instalar-editores.py`: instalação verificável sem sudo.
- `scripts/executar-editor.py`: execução com configuração gravável e display virtual quando necessário.
- `scripts/verificar-ferramentas.mjs`: verificação das ferramentas.
- `scripts/testar.mjs`: inicializa um servidor próprio para os testes, verifica o laboratório e executa as três suítes já existentes. Encerra apenas o servidor que ele próprio criou.
- `ambiente/`: instalação e instruções reutilizáveis para a nuvem.

## Fluxo

```sh
npm ci
npm run tools:install
npm run check:tools
npm run dev
```

Abra o menu pelo acesso ao servidor e o laboratório pelo caminho `/desenvolvimento/laboratorio/index.html`. O servidor escuta na rede local para permitir testes por celular. `npm run dev -- --host 127.0.0.1` restringe o acesso ao próprio computador quando desejado.

Para compilar e validar:

```sh
npm run build
npm run test:build
npm test
```

O laboratório carrega o motor Phaser, que tem um arquivo JavaScript maior do que o limite de aviso padrão do Vite. Esse arquivo pertence apenas ao laboratório e não é acrescentado às telas existentes. O aviso de tamanho não indica falha de compilação.

## Editores no ambiente da nuvem

Os executáveis ficam em `/workspace/.tools/guardiao/bin/tiled` e `/workspace/.tools/guardiao/bin/libresprite`. `GUARDIAO_TOOLS_DIR` permite escolher outro diretório. Com uma sessão gráfica disponível, os editores usam o display existente. Sem monitor, o Tiled inicia um Xvfb temporário; o LibreSprite usa o modo SDL apropriado para exportação em lote. O processo de display criado pelo comando é encerrado ao final.

Exemplos de exportação, a partir da raiz:

```sh
mkdir -p .cache/exportacoes
/workspace/.tools/guardiao/bin/tiled --export-map json desenvolvimento/modelos/mapa-base.tmj .cache/exportacoes/mapa.json
/workspace/.tools/guardiao/bin/libresprite --batch assets/itens-remodelados/kai/01_mangueira.png --save-as .cache/exportacoes/kai.aseprite
```

Os AppImages são verificados antes de executar ou extrair. O Xvfb do Debian é baixado por APT usando índices assinados e chaves oficiais, extraído em uma pasta própria, sem instalar pacotes no sistema. Os PNGs originais permanecem intactos.

Os testes de navegador em outro sistema precisam de Chromium/Chrome compatível, indicado por `CHROMIUM_PATH`, ou do Chromium instalado pelo Playwright. Os editores de desktop para Windows e macOS podem ser obtidos nos sites oficiais; o instalador em lote deste projeto é destinado ao Linux.
