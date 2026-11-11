# Trilhas Vivas

Revisão sobre `f00a1d9`. Código novo em `jogo/trilhas-vivas/`; as pastas anteriores foram preservadas. Entradas continuam em `jogo/viva/`, `jogo/floresta-viva/` e `jogo/jornada/`.

## Transições e interação

A cortina anterior desenhava catorze SVGs muito grandes contendo o atlas inteiro. A nova usa três folhas verdes recortadas em WebP, duas camadas compostas por CSS e uma abertura que espera `gameReady`/`uiReady`. Falhas de carregamento liberam a tela de erro, e o retorno pelo histórico limpa a cobertura. Trocas de aba mantêm a interface bloqueada apenas durante a passagem.

As folhas da abertura avançam a cada quadro, respeitam Menos movimento e a opção de desligá-las. Somente folhas verdes caem. O pequeno grupo que aparece nos botões tem limite e intervalo para evitar duplicações por foco, cursor e toque. A arte dos botões flutua dentro de uma área clicável fixa. O fundo responde ao cursor e ao dedo com deslocamento curto e interpolado; o encerramento do toque preserva a resposta visível. Fora da abertura o canvas das folhas deixa de trabalhar.

## Cenários e mapa

A ilha conserva a disposição antiga: cidade a noroeste, incêndios a nordeste, rio a leste, fauna a sudeste, reflorestamento a sudoeste e Árvore Guardiã no centro. Costa, estratos, rochas, rios, pontes, vila, abrigos, troncos, árvores e fogo são elementos separados. É possível selecionar uma região tocando seu terreno ou sua placa. O mapa inteiro cabe na tela em paisagem. Nenhuma pintura completa de mapa foi adicionada.

Os materiais provisórios são redesenhados quando as texturas terminam de carregar; a primeira versão sem texturas não fica guardada por engano. Os caminhos das fases 3–5 se ramificam entre os objetivos. O rio da fase 2 usa o mesmo contorno suavizado no desenho e na navegação. As quatro variedades de árvore têm tronco e copa separados: a copa cresce no mesmo ponto e balança. A restauração continua associada aos cuidados e ao progresso.

## Travamentos e desempenho

O cliente de rotas anterior não resolvia a inicialização se o Worker retornasse erro sem identificador de requisição. A nova versão detecta esse erro e a ausência de resposta na inicialização, encerra o Worker problemático e usa a busca cooperativa. Uma requisição sem resposta também tem limite. Os testes provocam esses dois defeitos e verificam uma rota válida e a resposta da interface.

O chão geométrico é preparado uma vez e atualizado durante a restauração. As camadas de água são recortadas e reutilizadas; o fluxo e os reflexos continuam animados. Pontes permanecem acima da água. Há descarte de objetos fora da câmera e um cache limitado a 12 MiB para redimensionamentos da vegetação. O desenho ativo acompanha o RAF, sem o antigo limite fixo de aproximadamente 30 FPS. A densidade de pixels considera a preferência gráfica.

A fase carrega apenas os trajes e personagens necessários. A mangueira deixa de ser baixada nas fases que não a usam, e o equipamento da fase selecionada pode ser adiantado enquanto a ficha está aberta. A abertura não baixa as cinco fases antecipadamente.

Medições de Chromium com toque emulado em 844×390, DPR 2: nas amostras da floresta e do rio, o percentil 95 do intervalo entre quadros passou de aproximadamente 50 ms para 16,8 ms. Os dados completos ficam nos relatórios `antes.json` e `depois.json` da entrega. Há variação e quadros mais demorados no carregamento; isso não é garantia de FPS em aparelho físico. Os testes de campanha, recursos, interface e rotas são separados da medição.

## Conferir e exportar

```sh
npm run build
npm run check:site
npm run test:build
python desenvolvimento/trilhas-vivas/exportar-javascript.py
```

A exportação produz uma pasta e um ZIP com todos os `.js`, `.mjs` e `.cjs` do projeto, preservando subpastas e excluindo dependências e saídas duplicadas de compilação. Ela confere os bytes de cada arquivo no ZIP. O pacote contém somente JavaScript; para executar o jogo também são necessários HTML, CSS e recursos do repositório.

Abertura sem cache: 62 recursos, 1.180.422 bytes (1,13 MiB), sem vídeo solicitado. O site completo ocupa cerca de 34,58 MiB; ele inclui artes de todas as fases, que não são baixadas todas na abertura.
