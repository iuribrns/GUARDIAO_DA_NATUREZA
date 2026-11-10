# Guardião da Natureza

Aventura de exploração em HTML, CSS e JavaScript para crianças de 5 a 10 anos. Kai e Flora cuidam de cinco regiões de uma ilha e devolvem força à Árvore Guardiã. O jogo funciona em **paisagem**, com teclado ou controles de toque.

[Jogar](https://iuribrns.github.io/GUARDIAO_DA_NATUREZA/) · [Código atual](jogo/raizes/) · [Estrutura](docs/ESTRUTURA.md) · [Publicação](docs/PUBLICACAO.md) · [Revisão e testes](desenvolvimento/raizes/README.md)

| Região | Cuidado | Aliado | Cristal |
| --- | --- | --- | --- |
| Floresta em Chamas | Apagar oito focos e levar três animais ao abrigo | Carlos | Vermelho |
| Rio Poluído | Recolher resíduos e ajudar peixes e tartaruga | Antônio | Azul |
| Resgate da Fauna | Encontrar a chave, responder perguntas e ajudar os animais | Marina | Amarelo |
| Reflorestamento | Plantar e regar seis mudas nativas | Rafael | Verde |
| Cidade Sustentável | Separar resíduos, ajustar painéis solares e cuidar dos jardins | Luciana | Violeta |

A seleção mostra somente as cinco regiões. A paisagem recuperada aparece depois da conquista. Ao completar todas, um vídeo mostra Kai levando o colar à Árvore Guardiã, a ilha florescendo e o encontro dos aliados. Os créditos aparecem no final. **Nova jornada** reinicia fases, itens, cristais e ilha, preservando áudio e controles.

## Jogar e ajustar

- **WASD / setas:** mover. **Enter:** conversar e cuidar; segure perto do fogo para usar a mangueira. **Espaço:** equipamento. **B:** mochila. **Esc:** pausa.
- No celular: joystick, equipamento e cuidado. A mochila fica no canto superior, junto de pausa e tela cheia.
- **Ajustes e mochila abrem sobre a fase**, sem trocar de página ou reiniciar a aventura. O modo Computador oculta o joystick e os botões de toque; o modo Celular os mostra.
- Configurações tem abas Áudio, Conforto e Controles. Sobre o jogo reúne História, Como jogar, Missão, Na natureza e Sobre Nós, com rolagem restrita ao conteúdo.

## Desenvolver

Node.js 24 LTS e Chromium/Chrome. Não é necessário instalar novas ferramentas para jogar.

```sh
npm ci
npm run dev
npm run build
npm run check:site
npm run test:build
```

`npm test` testa o servidor de desenvolvimento; `npm run test:build` testa os arquivos publicados. Ambos verificam colisões, cinco tamanhos de tela, ajustes sobre a fase, salvamento, reinício, tela cheia, vídeo e as cinco fases com teclado e toque. `CHROMIUM_PATH` permite indicar outra instalação de Chrome.

## Arte e arquivos

A entrada atual é `jogo/raizes/index.html`. As entradas anteriores redirecionam para ela, mantendo os favoritos. O fluxo atual usa WebP e carrega os sprites da fase escolhida; o vídeo fica para o final. `desenvolvimento/raizes/publicacao.json` define os arquivos que vão para o Pages.

O código das revisões anteriores permanece no repositório como referência. Binários antigos substituídos foram retirados; o inventário e o commit anterior para recuperá-los estão em `desenvolvimento/raizes/retirados.json`. Os testes históricos não são a suíte da campanha atual.

Projeto acadêmico da UNEB, disciplina Web 1, com apoio do Professor Peterson Lobato. Criação e gestão: Iuri Barroso Nascimento. Programação: Hicham Mohamed El Attar e Eric Nascimento. Design: Natson Evangelista.
