# Bosque Vivo

Revisão de 11/11/2026, sobre a versão restaurada `72a51f4`. A entrada continua em `jogo/viva/`; o código novo fica em `jogo/bosque-vivo/`. As pastas e artes anteriores foram preservadas.

## Cenários que mudam com o cuidado

`pintura.js` fornece os elementos; `cenario.js` compõe as cinco fases; `mapa.js` desenha a ilha de seleção. O terreno usa um campo de cores interpolado e textura leve; troncos, raízes, copas, água, trilhas, pontes, cercas e construções têm suas próprias posições. O crescimento altera a altura dos ramos e a escala das copas do mesmo objeto. As plantas passam de brotos para árvores. Os pontos de apoio permanecem fixos.

A restauração não carrega pinturas completas de antes/depois nem aplica recortes delas sobre o chão. A água clareia com a coleta, o solo recupera o verde ao redor dos cuidados e as árvores recuperam suas copas. No encerramento, a própria Árvore Guardiã cresce na ilha. A opção Menos movimento é respeitada.

- **Floresta:** trilhas entre o abrigo, o reservatório e a ponte; cinzas junto aos incêndios; troncos e copas que se recuperam. O chão livre é acessível; foram retiradas as antigas bordas invisíveis de clareiras e bosques. Cada tronco sólido é um objeto desenhado na mesma coordenada.
- **Rio:** duas margens com trilhas, ponte e píer, fluxo de água e praia contínua. A tartaruga inicia em `930,440`, sobre areia e fora da água; os peixes permanecem no rio e os animais voltam à área segura após o cuidado.
- **Fauna:** trilhas ligando os abrigos e cercados, com as passagens e perguntas preservadas. Os animais se deslocam até seus habitats depois do resgate.
- **Reflorestamento:** circuito entre os canteiros e a fonte. Enter planta e rega; o broto, os ramos e a copa crescem no próprio local.
- **Cidade:** circuito de coleta, lixeiras, casas, escola, painéis e jardins. A fumaça diminui conforme as tarefas são realizadas e desaparece ao concluir os cuidados.

As sombras fixas da pintura antiga foram retiradas; as sombras atuais acompanham as árvores desenhadas. As construções e os troncos usam colisão junto ao chão, sem bloquear pela altura da copa. As rotas de Kai e dos animais usam um Worker com a geometria atual. Se o navegador não oferecer Workers, a busca cede tempo à interface entre pequenos lotes.

## Kai, roupas e abertura

O adaptador antigo substituía os uniformes pelo explorador. O novo renderizador mantém a roupa recebida em cada fase, inclusive durante as ações correspondentes. O traje do rio permanece durante a exploração e o nado.

O atlas reúne 228 quadros: 180 para caminhada nos cinco trajes e com a mangueira, 24 para ações da missão e 24 para retirada/uso de equipamentos. Cada ciclo de caminhada tem seis passadas em cinco vistas; as vistas espelhadas completam as oito direções. Há alternância das pernas e dos braços, com escala e apoios medidos. A boca da mangueira tem um ponto próprio para prender o jato. A mochila mostra miniaturas dos trajes reais em um único WebP de 36.676 bytes.

O cenário aprovado da abertura foi mantido. Ele agora usa uma imagem explícita com prioridade, uma prévia WebP embutida e tentativas limitadas de recarregamento. Uma falha na imagem principal mantém o fundo visível. Os banners das missões e a apresentação da seleção receberam acabamento de madeira e verde.

## Compilar e conferir

```sh
npm ci
npm run build
npm run check:site
npm run test:build
```

A compilação agora recalcula o manifesto antes de copiar o site. Assim, uma arte ou um módulo novo não fica ausente do pacote por uma lista desatualizada. Quatorze pinturas completas de mapas deixaram o pacote público; permanecem no repositório.

A suíte atual está em `desenvolvimento/viva/testar.mjs`. Os componentes foram executados com Chromium:

- Campanha completa com teclado e com toque emulado, nas cinco fases: apagar incêndios, cuidar de todos os animais, perguntas, plantio e rega, reciclagem, painéis, jardins, retorno aos NPCs, cristais, salvamento após recarregar e encerramento na ilha.
- Colisões e caminhos executáveis para os objetivos; reservatório sólido, ponte transitável, rio, pedras, cercas, portões e canal. Não há moradores adicionais invisíveis.
- Interface em 1280×720, 844×390, 740×320, 667×375 e 932×430; inventário, silhuetas, trajes, pausa, ajustes na fase, tela cheia e reinício.
- Falha de rede na imagem da abertura, seis quadros distintos durante movimento pelo teclado, roupa de plantio durante plantar/regar, crescimento depois da ação e tartaruga fora da água.
- Restauração parcial e completa da ilha sem elementos SVG de imagem nem requisições das pinturas antigas. Prévia visual de estados isolados e campanha real são verificadas separadamente.
- Publicação numa subpasta equivalente ao Pages, sem recursos ausentes.

Os testes usam toque emulado em paisagem; não substituem uma medição em aparelho físico.

## Peso e medições

A abertura sem cache solicitou 50 recursos, 1.274.694 bytes (1,22 MiB), sem vídeo. O pacote completo ocupa aproximadamente 32,85 MiB, contra 33,76 MiB da revisão anterior, mesmo com as novas animações. Os personagens e as peças do cenário são WebP e carregam conforme a tela/fase.

Em `rotas-medidas.json`, o retorno dos três animais da floresta levou 556 ms no Worker, com 33 quadros de RAF observados e nenhuma chamada da busca no processo da interface. Rio e fauna também passaram; a alternativa sem Worker manteve a resposta do temporizador em 9,7 ms. São resultados deste ambiente, não promessas de FPS em celulares.

`preparar.py` e `preparar-cenario.py` documentam a compactação e a medição das artes geradas. Os PNGs de criação estão arquivados em `/workspace/generated_images`, fora do site. Os WebP e os atlas prontos estão no Git; a compilação não precisa de Python nem dos PNGs.
