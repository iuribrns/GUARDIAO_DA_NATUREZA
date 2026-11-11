# Guardião da Natureza

Aventura de exploração em HTML, CSS e JavaScript para crianças de 5 a 10 anos. Kai e Flora cuidam de cinco regiões de uma ilha e devolvem força à Árvore Guardiã. O jogo funciona em **paisagem**, com teclado ou controles de toque.

[Jogar](https://iuribrns.github.io/GUARDIAO_DA_NATUREZA/) · [Entrada](jogo/viva/) · [Código atual](jogo/bosque-vivo/) · [Estrutura](docs/ESTRUTURA.md) · [Publicação](docs/PUBLICACAO.md) · [Revisão e testes](desenvolvimento/bosque-vivo/README.md)

| Região             | Cuidado                                                        | Aliado  | Cristal  |
| ------------------ | -------------------------------------------------------------- | ------- | -------- |
| Floresta em Chamas | Apagar oito focos e levar três animais ao abrigo               | Carlos  | Vermelho |
| Rio Poluído        | Recolher resíduos e ajudar peixes e tartaruga                  | Antônio | Azul     |
| Resgate da Fauna   | Encontrar a chave, responder perguntas e ajudar os animais     | Marina  | Amarelo  |
| Reflorestamento    | Plantar e regar seis mudas nativas                             | Rafael  | Verde    |
| Cidade Sustentável | Separar resíduos, ajustar painéis solares e cuidar dos jardins | Luciana | Violeta  |

A seleção mostra somente as cinco regiões. A paisagem recuperada aparece depois da conquista. Ao completar todas, Kai percorre os caminhos do próprio mapa, ergue o colar e restaura a Árvore Guardiã em uma animação desenhada ao vivo, sem vídeo. Os créditos aparecem no final. **Nova jornada** reinicia fases, itens, cristais e ilha, preservando áudio e controles.

Os mapas atuais são compostos por terreno, água, caminhos, construções e árvores. Os mesmos troncos se alongam, as copas crescem e o terreno muda de cor com os objetivos; a restauração não revela outra pintura por cima do cenário. As cinco fases têm trilhas próprias e usam os elementos visíveis para definir as colisões.

## Jogar e ajustar

- **WASD / setas:** mover. **Enter:** conversar e cuidar; segure perto do fogo para usar a mangueira. **Espaço:** equipamento. **B:** mochila. **Esc:** pausa.
- No celular: joystick, equipamento e cuidado. A mochila fica no canto superior, junto de pausa e tela cheia.
- **Ajustes e mochila abrem sobre a fase**, sem trocar de página ou reiniciar a aventura. O modo Computador oculta o joystick e os botões de toque; o modo Celular os mostra. Passeio tranquilo deixa Kai 18% mais lento e pode ser desligado.
- A mochila também pode ser aberta no mapa; ferramentas e trajes não descobertos aparecem em silhueta.
- Configurações tem abas Áudio, Conforto, Controles e Imagem. Sobre o jogo reúne História, Como jogar, Missão, Na natureza e Sobre Nós, com rolagem restrita ao conteúdo.

## Desenvolver

Node.js 24 LTS e Chromium/Chrome. Não é necessário instalar novas ferramentas para jogar.

```sh
npm ci
npm run dev
npm run build
npm run check:site
npm run test:build
```

`npm test` testa o servidor de desenvolvimento; `npm run test:build` testa os arquivos publicados. Ambos verificam colisões, cinco tamanhos de tela, ajustes sobre a fase, salvamento, reinício, tela cheia, encerramento no mapa e as cinco fases com teclado e toque. `CHROMIUM_PATH` permite indicar outra instalação de Chrome.

## Arte e arquivos

A entrada atual é `jogo/viva/index.html`; os controladores e cenários atuais ficam em `jogo/bosque-vivo/`. As entradas anteriores redirecionam para o menu, mantendo os favoritos. O fluxo usa WebP e carrega os sprites quando a tela ou fase precisa deles. Na medição local em Chromium, a abertura solicitou 1,22 MiB; o site completo ocupa aproximadamente 32,85 MiB. Não há download de vídeo nem do laboratório no jogo publicado. `desenvolvimento/viva/publicacao.json` define os arquivos que vão para o Pages e é atualizado a cada compilação.

Kai tem seis passadas em cada vista, com roupas de explorador, proteção do rio, resgate, plantio e voluntariado. As ações de cuidado, plantio, rega e coleta mantêm o traje da missão. Os caminhos dos animais e a orientação até os objetivos são calculados em segundo plano; uma alternativa em pequenos lotes atende navegadores sem Web Workers.

Esta revisão preserva as pastas e artes anteriores. Os arquivos que deixaram de ser usados ficam fora da publicação. A limpeza feita em uma revisão anterior está documentada em `desenvolvimento/raizes/retirados.json`. Os testes históricos não são a suíte da campanha atual.

Projeto acadêmico da UNEB, disciplina Web 1, com apoio do Professor Peterson Lobato. Criação e gestão: Iuri Barroso Nascimento. Programação: Hicham Mohamed El Attar e Eric Nascimento. Design: Natson Evangelista.
