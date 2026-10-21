# Guardião da Natureza

Jogo em HTML, CSS e JavaScript com foco em celular. O menu, o mapa de seleção e o colar usam as artes aprovadas. A área `desenvolvimento/` reúne as ferramentas para criar e animar as próximas fases.

## Começar

Use Node.js 24 LTS (a versão está em `.nvmrc`). Na raiz do projeto:

```sh
npm ci
npm run dev
```

O servidor Vite abre o menu atual a partir da raiz. Para testar no celular na mesma rede, use o endereço de rede informado pelo Vite no terminal. No ambiente na nuvem, use o acesso disponibilizado pela plataforma.

O laboratório fica no caminho `/desenvolvimento/laboratorio/index.html`. Ele mostra uma animação real de Kai com a mangueira, usando Phaser e GSAP, com pausa e respeito a movimento reduzido. É uma ferramenta separada para desenvolvimento; não altera o progresso das fases.

## Menu vivo, configurações e sobre o jogo

As folhas do cenário usam recortes individuais da arte, com queda, balanço e giro independentes. Em **Configurações**, os ajustes ficam em cartões de som e conforto, com volumes visuais e preferências salvas. **Sobre o jogo** apresenta a história, os controles para celular e o colar remodelado.

Toque em Kai ou Flora para ver expressões e ler suas respostas. No computador, os personagens também reagem ao cursor. Flora tem seis poses novas, incluindo olhos fechados e asas abertas. As animações param com movimento reduzido ou quando a aba fica oculta.

Os arquivos novos e sua documentação estão em [tela-inicial/menu-vivo/README.md](tela-inicial/menu-vivo/README.md).

## Mapa interativo e informações das fases

Em **Jogar**, toque na placa ou no terreno de uma região para conhecer sua missão. O mapa tem correntes, ondulações, fogo, fumaça e portal animados; os controles permitem ampliar e arrastar a ilha. Em pé, o celular também mostra uma lista de fases com áreas de toque maiores.

Cada seleção abre um painel com o aliado, a situação, três objetivos, o equipamento, a recompensa e a duração estimada fornecidos em `paineis-das-fases.zip`. Os personagens alternam poses durante a leitura. As animações respeitam a configuração de movimento reduzido e pausam quando a aba fica oculta.

A recuperação da floresta continua disponível como prévia, separada do progresso real. As seis missões jogáveis ainda estão em desenvolvimento. Detalhes dos arquivos em [tela-inicial/mapa-interativo/README.md](tela-inicial/mapa-interativo/README.md).

## Ferramentas instaladas

| Ferramenta | Versão | Uso |
|---|---|---|
| Phaser | 3.90.0 | Motor 2D, sprites e futuras fases jogáveis |
| GSAP | 3.15.0 | Sequências e transições de animação |
| Vite | 8.3.5 | Servidor com atualização automática e compilação |
| Playwright Core | 1.64.1 | Testes de navegador com Chromium |
| Tiled | 1.12.2 | Edição e exportação de mapas |
| LibreSprite | 1.3 | Edição e exportação de sprites |

Phaser é carregado pelo laboratório. GSAP também anima as reações de Kai, Flora e do colar nas telas do menu; uma cópia local versionada permite hospedagem estática, sem CDN. O modelo inicial de mapa para o Tiled está em `desenvolvimento/modelos/mapa-base.tmj`.

## Comandos

```sh
npm run build        # Gera dist/ com o jogo e o laboratório
npm run preview      # Serve a compilação de produção
npm test             # Testa o laboratório, as transições, o mapa e as folhas
npm run test:build   # Testa a versão compilada no navegador
npm run tools:install # Instala Tiled e LibreSprite no Linux da nuvem
npm run check:tools  # Confere versões e funcionamento dos editores
```

Os testes usam `/usr/bin/chromium` quando disponível. Outra instalação pode ser indicada por `CHROMIUM_PATH`. Em outro computador, também é possível instalar o navegador do Playwright com `npx playwright-core install chromium`.

A compilação copia apenas `assets/`, `tela-inicial/` e os modelos públicos, além do laboratório compilado. Dependências, caches e dados do Git não entram em `dist/`. O jogo atual também pode ser servido diretamente como arquivos estáticos.

## Editores de mapas e sprites

No ambiente Linux da nuvem, `npm run tools:install` baixa as versões oficiais, verifica os SHA-256 publicados e as instala sem permissões de administrador em `/workspace/.tools/guardiao`. O instalador prepara um display virtual para os comandos do Tiled quando necessário. A configuração dos editores usa uma pasta gravável própria, sem alterar a pasta pessoal do usuário.

Para edição com janelas no seu computador, instale [Tiled](https://www.mapeditor.org/) e [LibreSprite](https://libresprite.github.io/) nas versões adequadas ao seu sistema. O instalador automático de editores deste projeto atende Linux x86_64; o preparo automático de display virtual foi testado em Debian 13.

Detalhes, limites e instruções de inicialização estão em [desenvolvimento/README.md](desenvolvimento/README.md). As instruções reutilizáveis da nuvem estão em `desenvolvimento/ambiente/`.
