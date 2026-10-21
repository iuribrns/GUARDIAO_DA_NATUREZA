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

## Ferramentas instaladas

| Ferramenta | Versão | Uso |
|---|---|---|
| Phaser | 3.90.0 | Motor 2D, sprites e futuras fases jogáveis |
| GSAP | 3.15.0 | Sequências e transições de animação |
| Vite | 8.3.5 | Servidor com atualização automática e compilação |
| Playwright Core | 1.64.1 | Testes de navegador com Chromium |
| Tiled | 1.12.2 | Edição e exportação de mapas |
| LibreSprite | 1.3 | Edição e exportação de sprites |

Phaser e GSAP são carregados somente pelo laboratório por enquanto. As telas existentes mantêm seus scripts e animações atuais. O modelo inicial de mapa para o Tiled está em `desenvolvimento/modelos/mapa-base.tmj`.

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
