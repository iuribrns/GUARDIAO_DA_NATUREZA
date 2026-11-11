# Sereno — resgates, equipamentos e interface

Revisão de 11/11/2026. Entrada: `jogo/viva/index.html`. Código novo: `jogo/sereno/`. As pastas anteriores foram preservadas.

## Resgates nas três regiões com animais

As buscas de caminho A* rodavam no mesmo processo que desenha a tela. As rotas mais longas da floresta podiam ocupar esse processo por segundos ao resgatar um animal. Agora o retorno dos animais, a orientação pelas missões e o retorno de Kai ao NPC usam `rotas-worker.js`. Ele importa a mesma geometria e navegação do jogo, incluindo incêndios e jaulas dinâmicos.

Enquanto a rota está sendo calculada, o animal aguarda sem bloquear a renderização ou os comandos. O objetivo só é concluído quando ele chega ao abrigo. O salvamento recompõe as rotas pendentes ao retomar a fase. Comandos manuais invalidam uma orientação anterior para uma resposta atrasada não mover Kai sozinha.

Se Web Workers estiverem indisponíveis ou falharem, `busca-cooperativa.js` divide a busca em lotes de aproximadamente 5 ms. Os pés, o raio de colisão e as passagens aprovadas continuam com a mesma geometria. A breve animação de cuidado mostra progresso aos pés de Kai.

Medição em Chromium local, sem acelerar o relógio, executando todos os retornos de cada região:

| Região | Rotas | Tempo total | Chamadas de A* no processo da interface |
| --- | ---: | ---: | ---: |
| Floresta em Chamas | 3 | 1.488 ms | 0 |
| Rio Poluído | 3 | 30 ms | 0 |
| Resgate da Fauna | 4 | 73 ms | 0 |

Durante as buscas da floresta foram observados 89 quadros; o maior intervalo entre eles foi 16,8 ms. Na alternativa sem Worker, o temporizador da interface respondeu em 6,2 ms e a rota gerada foi validada contra as colisões. São medições deste ambiente, não uma promessa de desempenho em celular físico. Dados completos: `rotas-medidas.json`.

## Arte e interações

- 72 quadros de personagens: 24 de equipamentos, oito de conquista, 16 de caminhada, 16 com mangueira e oito de ações. Novas sequências mostram mangueira, kit, rede e mochila; a mochila também tem uma animação no próprio cabeçalho, sem criar uma espera para abri-la.
- Kai com pele mais morena e cabelo cacheado. Os quadros retocados mantêm os apoios e a posição do bico da mangueira. A nova abertura preserva a ponte e a árvore, com Flora de costas no ombro de Kai.
- A coleção volta a usar a prévia do traje de proteção/mergulho anterior; os outros trajes foram mantidos.
- O colar usa novas poses, uma trajetória curva para a pedra e um encaixe suave, com as cores e a quantidade de cristais conquistados. O texto tem contraste escuro sobre madeira clara. Continuar recebe foco quando está disponível.
- Pausa, mochila e tela cheia têm arte contida nos botões. O oceano preenche a janela ao redor da ilha, que continua inteira e alinhada aos marcadores, inclusive fora de tela cheia.
- Na abertura caem apenas folhas verdes, de 24 a 36 px: 18 no celular, 24 no computador e dez no modo Leve. A região sobre textos e personagens recebe menos opacidade. Menos movimento e a preferência de folhas continuam respeitados.
- Mouse, foco e toque soltam quatro partículas por reação, com no máximo oito ativas e intervalo por botão. Flores aparecem apenas nessas reações. Partículas vencidas são removidas antes do desenho e a transparência é limitada ao intervalo válido, eliminando o clarão de fim de vida.
- Título e conteúdo visual de Jogar/Sobre flutuam suavemente. A área clicável permanece parada para não dificultar o toque.

`preparar.py` documenta a compactação e a medição dos PNGs gerados, arquivados fora da publicação em `/workspace/generated_images`. Para compilar o jogo, bastam os WebP e o atlas prontos que estão no repositório; Python e os PNGs não são necessários.

## Validação

```sh
npm ci
npm run build
npm run check:site
npm run test:build
```

`desenvolvimento/viva/testar.mjs` reúne a suíte atual. Foram executados:

- Campanha completa com teclado e com toque emulado, pelas cinco regiões: ações reais, resgates, perguntas, plantio, reciclagem, recompensas, salvamento após recarregar e restauração final da árvore.
- Resgates e rotas de todos os animais da floresta, rio e fauna; interface responsiva durante a busca; alternativa sem Worker; validade física dos caminhos.
- Geometria: reservatório, ponte, quinas do resgate, rochas, cercas, portões, píer, fonte e canal; todos os objetivos alcançáveis.
- Interface em 1280×720, 844×390, 740×320 e 667×375, além da regressão que inclui 932×430: limites dos ícones, folhas verdes, expiração e repetição das reações, hitboxes fixas dos botões flutuantes, mochila, trajes, pausa, ajustes e entrada/saída de tela cheia.
- Encaixe de cada um dos cinco cristais e continuidade após a conquista. O teste visual isolado usa salvamentos preparados; a campanha completa obtém os cristais pelas ações do jogo.
- Publicação em subpasta equivalente ao GitHub Pages, sem recursos ausentes.

A abertura sem cache solicitou 45 recursos e 1.217.034 bytes (1,16 MiB), sem vídeo. O pacote completo ocupa 37.335.801 bytes (35,61 MiB). Novos sprites são buscados quando necessários. A medição de abertura está em `carregamento.json` e pode ser repetida com `medir-carregamento.cjs`.
