# Carregamento, transições e personagens

Implementação em `jogo/brisa-suave/`. Os mapas ilustrados de `reencontro/assets`
continuam ativos. As fontes anteriores foram preservadas no repositório.

## Mudanças de execução

- A publicação agrupa os scripts clássicos na mesma ordem: 47 → 1 na inicial,
  94 → 1 na floresta e 93 → 1 na jornada, nesta revisão. Os caminhos das imagens
  e dos Workers continuam relativos ao arquivo de origem, inclusive em subpastas
  do GitHub Pages. O processo usa apenas Node.js, sem instalação extra no Pages.
- A jornada deixou de gerar a geometria de quatro cenários nativos que eram
  descartados em seguida. O mesmo cadastro ilustrado continua sendo usado na
  física e nos objetivos.
- O início da fase aguarda apenas a paisagem inicial. A arte restaurada é
  preparada depois, com prioridade baixa. O chão completo passa por uma única
  composição enquanto não há mudanças, em vez de duas imagens por quadro.
- As fases não carregam mais pranchas de ações antigas já substituídas, nem as
  texturas de vegetação do cenário nativo descartado. A fase 4 carrega a prancha
  usada nas mudas, que continuam crescendo no terreno.
- O painel da fase faz prefetch apenas da fase desbloqueada selecionada.
- As etiquetas reaproveitam a medição da HUD por 120 ms; mudança de tamanho ou
  de preferências invalida a medição imediatamente.

## Passagem de tela

A nova passagem usa oito folhas pequenas e composição de transformações. Não há
carregamento da vegetação descartada durante a cortina. Na navegação para outro
documento, a página de saída permanece coberta até a chegada, evitando o lampejo
de reabrir a tela antiga. A primeira visita não fica coberta à espera de artes
opcionais. Esperas por imagens têm limite para não prender os controles.

## Personagens e celular

- 40 poses de Flora: cinco perspectivas, com voo, pouso e asas dobradas. Os
  reflexos completam as oito direções; a vista de costas tem arte própria.
- 30 poses de caminhada com traje de rio, 32 de nado/vestir/resgate e 25 poses
  paradas nos cinco uniformes. Todas seguem a mesma identidade de Kai.
- A orientação da Flora acompanha a pose que foi efetivamente desenhada para
  Kai. A mochila usa uma miniatura leve do novo traje, com o mesmo desenho.
- A HUD do celular ficou mais larga, com os rótulos e a orientação atual visíveis.
  Os botões de ação foram reduzidos para 58 px e os superiores têm 44 px, com as
  ilustrações contidas em cada botão. O objetivo de abrir a água aparece enquanto
  for necessário e sai da HUD depois da liberação.

## Verificação

```sh
npm run test:polimento
npm run check:site
npm run audit:files
```

Os testes verificam isolamento dos 127 novos sprites, direções e pouso, traje e
nado, estados de navegação, espera de imagens, cache de terreno, geometria dos
objetivos e execução dos scripts agrupados em subpasta. A aparência e o desempenho
em um celular real precisam da verificação no navegador: nesta sessão, o Chromium
foi bloqueado pela restrição de sockets e a solicitação de execução fora da
restrição foi cancelada. Não há medição de FPS ou de tempo de carregamento real
aprovada nesta revisão.

Para recriar os atlas, use `empacotar-personagens.py` com as quatro pranchas PNG
de origem (Flora, caminhada com traje, ações do rio, poses paradas). PNGs de
trabalho não são incluídos no site; os atlas publicados são WebP.
