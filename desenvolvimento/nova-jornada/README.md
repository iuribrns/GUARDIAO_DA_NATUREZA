# Recomeçar a jornada e tela cheia

Atualização de 04/11/2026. O código novo fica em `jogo/nova-jornada/`; as pastas anteriores foram preservadas.

## Jogar do início

Depois de concluir as cinco fases, o encerramento e a parte inferior dos créditos oferecem **Jogar do início**. Uma confirmação explica o que será apagado, com o foco inicialmente em **Continuar por aqui**, para evitar um reinício acidental.

Confirmar apaga os registros de missão das cinco fases, o progresso da ilha, os cristais, os equipamentos e os trajes conquistados, incluindo os saves antigos da floresta. A página inicial abre em um documento novo. No mapa, a natureza volta ao estado devastado, o contador mostra zero cristais e somente a primeira fase está liberada. Carlos volta a apresentar a missão e entregar o equipamento.

Preferências de áudio, acessibilidade e controles são mantidas. O botão não utiliza `localStorage.clear()`: somente as chaves conhecidas da campanha são removidas. Se uma operação falhar, os dados removidos são repostos e o jogador permanece na confirmação. Um identificador de geração invalida outras abas e documentos antigos no histórico, impedindo que reabram a jornada anterior em memória.

## Tela cheia

O ícone de expandir aparece na tela inicial, no mapa, nas configurações, em Sobre o jogo, nas fases e no encerramento, tanto no computador quanto no celular. Ao ativar, passa a mostrar o ícone de recolher e o nome acessível **Sair da tela cheia**. A saída externa pelo navegador também atualiza o controle.

A solicitação inclui a raiz HTML, para manter os diálogos dentro da tela cheia. Há um controle nas informações da fase, nas apresentações dos aliados, nos créditos e na confirmação de reinício. Na pausa, ele fica junto de **Continuar**. O joystick permanece sujeito à preferência computador/celular; o ícone de tela cheia não depende dela.

São usadas as APIs nativas padrão e WebKit. No toque, o jogo tenta manter a orientação deitada quando o navegador permite. A compatibilidade depende do navegador: se a solicitação for recusada ou não existir, aparece uma explicação com a alternativa de adicionar o jogo à tela inicial. O controle não simula uma tela cheia inexistente.

## Validação

```sh
npm run build
npm run check:site
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/nova-jornada/validacao/controles.cjs
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/nova-jornada/validacao/interface.cjs
```

Inicie `npm run preview` antes dos testes individuais. Os dois validadores também participam de `npm test` e `npm run test:build`. O primeiro testa a API real de tela cheia do Chromium, mouse/toque, diálogos, ausência/recusa de suporte, a alternativa WebKit, cancelamento e falha de armazenamento, limpeza completa da campanha e a invalidação de outra aba. O segundo percorre as cinco fases, seleções, pausa, mochila, configurações e encerramento em cinco tamanhos de tela deitada. Todos os testes usam contextos isolados, sem alterar o progresso de jogadores.
