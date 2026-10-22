# Guardião da Natureza

Jogo em HTML, CSS e JavaScript com foco em celular. O menu, a ilha de seleção e a floresta usam ilustrações e animações próprias. A área `desenvolvimento/` reúne as ferramentas para criar e animar as próximas fases.

[Endereço do jogo no Pages](https://iuribrns.github.io/GUARDIAO_DA_NATUREZA/) · [Organização das pastas](docs/ESTRUTURA.md) · [Publicação](docs/PUBLICACAO.md)

A raiz agora contém `index.html`, que abre diretamente o menu. `jogo/` reúne a primeira fase em área aberta e os controles; `assets/` guarda as artes compartilhadas; `tela-inicial/` mantém as telas existentes; `desenvolvimento/` guarda ferramentas e testes; `docs/` explica a estrutura e a publicação. As pastas anteriores foram preservadas.

## Primeira fase: Floresta Viva

**Jogar → Floresta em Chamas → Entrar na floresta** abre a nova floresta em 2D isométrico, sem montanhas. Kai começa ao lado de Carlos, conversa com ele e recebe a mangueira e o kit. Depois, apaga oito focos, trata três animais e os acompanha pelas trilhas até Carlos. Cada área queimada volta a ficar verde. Ao retornar para Carlos, Kai recebe e ergue o fragmento do colar, e comemora com Flora.

A versão anterior tinha **108 quadros** (preservados): Kai com mangueira em oito direções, caminhada, repouso e premiação; voo, pouso e comemoração de Flora; animais feridos, tratados e em movimento; Carlos, itens, jato, árvores e folhas. Quando Kai fica parado, Flora pousa no ombro. Os balões de natureza desaparecem após a leitura. O código e as artes ficam em [`jogo/floresta-viva/`](jogo/floresta-viva/README.md); o mapa anterior continua preservado em `jogo/area-aberta/`.

Controles: joystick nos dois eixos, água, mão e mochila. No computador: WASD/setas, espaço, E e B. O progresso e o fragmento são salvos neste navegador. As fases 2 a 6 continuam em desenvolvimento.

## Revisão da aventura para celular

A floresta ganhou cenário ilustrado suave, **128 quadros remodelados**, navegação com colisão nos pés, proteção do reservatório e travessia correta da ponte. Kai e os animais usam o mesmo sistema de trilhas. A missão ocupa uma faixa compacta; toque no título para ver detalhes. As orientações são curtas e aparecem uma de cada vez.

Ao terminar os resgates, Flora guia Kai de volta a Carlos. O **fragmento vermelho** tem novas poses de entrega, elevação e comemoração. A tela de conclusão mostra os resultados e leva ao próximo destino no mapa. A seleção de fases tem uma ilha nova e seis prévias de restauração que não alteram conquistas. **Somente a primeira fase é jogável**; Rio Poluído mostra o próximo desafio e permanece em desenvolvimento.

Configurações inclui joystick à direita, tamanho dos controles e dicas automáticas da Flora. Sobre o jogo ensina exploração em oito direções e traz sugestões de cuidado com a natureza. O treino de pulo anterior foi preservado apenas no laboratório de desenvolvimento.

Documentação: [revisão da fase](jogo/floresta-viva/revisao/README.md) e [ilha e menus](tela-inicial/jornada-viva/README.md).

O workflow do Pages está em `.github/workflows/pages.yml` e publica `dist/` a cada push na `main`, depois da ativação inicial do Pages com a fonte **GitHub Actions**. Confira a execução em Actions para confirmar que a versão está no ar.

## Começar

Use Node.js 24 LTS (a versão está em `.nvmrc`). Na raiz do projeto:

```sh
npm ci
npm run dev
```

O servidor Vite abre o menu atual a partir da raiz. Para testar no celular na mesma rede, use o endereço de rede informado pelo Vite no terminal. No ambiente na nuvem, use o acesso disponibilizado pela plataforma.

O laboratório fica no caminho `/desenvolvimento/laboratorio/index.html`. Ele mostra uma animação real de Kai com a mangueira, usando Phaser e GSAP, com pausa e respeito a movimento reduzido. É uma ferramenta separada para desenvolvimento; não altera o progresso das fases.

## Animações de Kai

O laboratório legado preserva **12 quadros de caminhada, 8 de salto e 4 de repouso**, separados da campanha atual. A caminhada acompanha a distância do joystick, e o salto usa poses de impulso, subida, queda e aterrissagem. Os movimentos para a esquerda espelham os sprites para a direita.

As pranchas, os metadados e os 24 recortes individuais estão em [`assets/personagens/kai/animacoes/`](assets/personagens/kai/animacoes/README.md). O renderizador reutilizável fica em [`jogo/personagens/kai/`](jogo/personagens/kai/README.md).

## Menu vivo, configurações e sobre o jogo

As folhas do cenário usam recortes individuais da arte, com queda, balanço e giro independentes. Em **Configurações**, os ajustes ficam em cartões de som e conforto, com volumes visuais e preferências salvas. **Sobre o jogo** apresenta a história, os controles para celular e o colar remodelado.

Toque em Kai ou Flora para ver expressões e ler suas respostas. No computador, os personagens também reagem ao cursor. Flora tem seis poses novas, incluindo olhos fechados e asas abertas. As animações param com movimento reduzido ou quando a aba fica oculta.

Os arquivos novos e sua documentação estão em [tela-inicial/menu-vivo/README.md](tela-inicial/menu-vivo/README.md).

## Mapa interativo e informações das fases

Em **Jogar**, toque na placa de uma região para conhecer sua missão. A ilha tem correntes, ondulações, fogo, fumaça, folhas e portal animados. No celular, arraste a ilha e use Encontrar Kai para retornar ao destino atual; a lista abaixo oferece outra forma de escolher.

Cada seleção abre um painel com o aliado, a situação, três objetivos, o equipamento, a recompensa e a duração estimada fornecidos em `paineis-das-fases.zip`. O retrato de Kai acompanha o destino atual. As animações respeitam a configuração de movimento reduzido e pausam quando a aba fica oculta.

A recuperação da floresta continua disponível como prévia, separada do progresso real. A primeira missão já pode ser jogada em área aberta; as demais estão em desenvolvimento. Detalhes dos arquivos em [tela-inicial/mapa-interativo/README.md](tela-inicial/mapa-interativo/README.md).

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
npm run check:site   # Confere a entrada e os caminhos do site para o Pages
npm test             # Testa o laboratório, as transições, o mapa e as folhas
npm run test:build   # Testa a versão compilada no navegador
npm run tools:install # Instala Tiled e LibreSprite no Linux da nuvem
npm run check:tools  # Confere versões e funcionamento dos editores
```

Os testes usam `/usr/bin/chromium` quando disponível. Outra instalação pode ser indicada por `CHROMIUM_PATH`. Em outro computador, também é possível instalar o navegador do Playwright com `npx playwright-core install chromium`.

A compilação copia `assets/`, `tela-inicial/`, `jogo/`, a entrada da raiz e os modelos públicos, além do laboratório compilado. Dependências, caches e dados do Git não entram em `dist/`. O jogo atual também pode ser servido diretamente como arquivos estáticos.

## Editores de mapas e sprites

No ambiente Linux da nuvem, `npm run tools:install` baixa as versões oficiais, verifica os SHA-256 publicados e as instala sem permissões de administrador em `/workspace/.tools/guardiao`. O instalador prepara um display virtual para os comandos do Tiled quando necessário. A configuração dos editores usa uma pasta gravável própria, sem alterar a pasta pessoal do usuário.

Para edição com janelas no seu computador, instale [Tiled](https://www.mapeditor.org/) e [LibreSprite](https://libresprite.github.io/) nas versões adequadas ao seu sistema. O instalador automático de editores deste projeto atende Linux x86_64; o preparo automático de display virtual foi testado em Debian 13.

Detalhes, limites e instruções de inicialização estão em [desenvolvimento/README.md](desenvolvimento/README.md). As instruções reutilizáveis da nuvem estão em `desenvolvimento/ambiente/`.
