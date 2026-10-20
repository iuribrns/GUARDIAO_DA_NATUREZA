# Guardião da Natureza — modelo da gravação

Interface em HTML, CSS e JavaScript baseada na gravação `tela-inicial-animada.mp4` enviada pelo usuário. O título usa o singular **GUARDIÃO DA NATUREZA**, letras marrons/verdes em uma placa clara com cipós e flores, e a placa menor **Jornada de Kai**. Kai e Flora aparecem de costas à direita, diante do vale, com o menu de duas placas à esquerda. A engrenagem abre Configurações; o botão de mochila continua removido conforme a solicitação anterior.

## Executar

Na raiz do repositório:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Abra o caminho `/tela-inicial/nova-versao/index.html` no servidor. O endereço anterior `/tela-inicial/index.html` encaminha para esta interface. Os HTMLs também podem ser abertos diretamente no navegador, mantendo a estrutura de pastas.

## Telas e arquivos

- `index.html`: título ilustrado, Jogar, Sobre o jogo e engrenagem de Configurações.
- `configuracoes.html`: música ambiente, efeitos, volumes, prévia, texto maior, folhas no cenário e redução de animações, com áreas de toque ampliadas.
- `sobre.html`: história, controles para celular, teclado opcional e missão do colar.
- `aventura.html`: seleção de fases em desenvolvimento. A pasta beta foi excluída pelo usuário; nenhuma fase foi recriada nesta tarefa.
- `app.js`: preferências, áudio sintetizado localmente, abas e folhas em movimento.
- `transicoes.js` e `transicoes.css`: transição circular e animação das abas/botões.
- `modelo.css`: composição e estilo da gravação, sobre os estilos compartilhados existentes.
- `entrada.js`: encaminhamento do endereço antigo.

## Transição circular

Ao tocar num link de navegação, um círculo verde parte do ponto tocado e se expande até cobrir a tela. Pelo teclado, o centro do botão é usado como origem. Ao concluir a cobertura, a próxima página abre e o círculo encolhe a partir do mesmo ponto, revelando o conteúdo. Os painéis também têm uma entrada suave. A expansão usa `transform` e keyframes, sem exigir `clip-path` nem transições nativas do navegador. A navegação continua funcionando se o armazenamento for bloqueado, o CSS falhar ou a animação for interrompida; há um limite de espera tanto na saída quanto na chegada. Sem armazenamento, a saída circular e a entrada do painel continuam disponíveis. Âncoras locais, nova aba, downloads e links externos mantêm o comportamento padrão. Voltar pelo navegador não deixa a interface coberta ou bloqueada.

Movimento reduzido, escolhido nas configurações ou solicitado pelo sistema, desliga o efeito; a tela de configurações informa quando isso acontece. A opção **Folhas no cenário** é independente: desligá-la não remove as transições. A preferência antiga `guardiao.menu.preferences.motion` é migrada somente para as folhas. A preferência de movimento do sistema é consultada em tempo real, sem gravá-la como uma escolha manual permanente. A área circular decorativa não entra na leitura por tecnologia assistiva.

## Arte e preferências

`assets/floresta-modelo.png` e `assets/titulo-guardiao.png` foram preparados a partir de frames da gravação, usando a referência para recompor o cenário sem UI e isolar/reproduzir a placa do título com transparência. São assets adaptados da referência, não uma reprodução do vídeo em segundo plano. A prancha de folhas e a fonte Lilita One já existentes foram mantidas, com sua licença em `assets/OFL-Lilita-One.txt`.

As preferências ficam em `guardiao.horizonte.preferences.v1`. Áudio começa após interação e música pausa quando a aba fica oculta. Sem armazenamento, os controles continuam funcionando na sessão. Texto maior afeta as telas do menu; folhas e personagens não dependem de reprodução de vídeo. Kai e Flora continuam estáticos.

## Validação

Validado em Chromium, inclusive com toque emulado, em desktop 1280×720 e telas de 320, 390 e 667 px: carregamento do logo/cenário, título singular, origem e expansão real do círculo, ida e volta entre as quatro telas, engrenagem, abas, preferências persistidas, movimento reduzido, armazenamento bloqueado e ausência de overflow horizontal. Testes em navegador emulado não substituem a verificação em aparelhos físicos.

As pastas e artes das versões anteriores foram preservadas. O desenvolvimento das fases permanece separado da interface.

## Integração do ZIP atualizado pelo Claude

O ZIP enviado pelo usuário foi revisado e comparado com o repositório, sem substituir arquivos por versões anteriores. As artes de Jogar, Sobre e Configurações foram preservadas em `assets/claude/`. Jogar e Sobre usam os sprites em links HTML acessíveis. A engrenagem passou a usar um símbolo SVG com oito dentes iguais, furo circular e proporção fixa, evitando a deformação do recorte rasterizado; o arquivo original foi mantido. `ambiente.js` e `melhorias.css` adicionam raios de luz discretos, brilhos e a apresentação dos sprites de Jogar e Sobre; `transicoes.js` ganhou uma rajada de folhas na cobertura/revelação da próxima tela.

Há 6 brilhos em telas pequenas e 12 em maiores; a rajada usa 8 ou 14 folhas. Os efeitos são CSS, respeitam movimento reduzido, pausam com a aba oculta e não interceptam cliques. Não há espera artificial de vários segundos para mostrar o efeito. As versões anteriores do menu e os personagens permanecem preservados.

O protótipo do ZIP tinha somente o botão Jogar conectado e apontava para a pasta beta excluída. A integração usa os destinos atuais — missões, Sobre e Configurações — e não reintroduz arquivos removidos. O fundo do ZIP apresentava áreas preenchidas/esticadas; foi mantido o cenário limpo já aprovado.

Validação adicional: carregamento dos sprites, alternativa com as imagens bloqueadas, links por toque, rajada real, limite de partículas por tamanho de tela, preferências persistidas e áreas de toque com pelo menos 44 px. Os testes gerais das quatro telas e movimento reduzido também passaram em Chromium.

## Regressão das transições e da engrenagem

`validacao/transicoes.cjs` verifica, em Chromium, a progressão visual do círculo na saída e na revelação das três telas, mesmo com `CSS.supports('clip-path', ...)` retornando falso. Cobre também a preferência antiga das folhas desligadas, navegação por toque e teclado, proporções da engrenagem, preferências salvas, movimento reduzido do sistema, armazenamento bloqueado, CSS ausente, animação interrompida e larguras de 320 a 1280 px.

Com o servidor local ativo, instale a ferramenta de validação fora do projeto e execute:

```sh
npm install --prefix /tmp/guardiao-validacao playwright-core
NODE_PATH=/tmp/guardiao-validacao/node_modules GUARDIAO_TEST_URL=http://127.0.0.1:8000/tela-inicial/nova-versao/ node tela-inicial/nova-versao/validacao/transicoes.cjs
```

O script usa `/usr/bin/chromium`; para outra instalação, informe `CHROMIUM_PATH`. O jogo continua sem dependências de execução ou processo de build. Os HTMLs usam a versão `transicoes-2` nos recursos alterados para evitar reaproveitar os scripts e estilos anteriores do cache.
