# Validação das folhas nas transições

A correção de tamanho, contraste e tempo enviada em `CORRECAO-FOLHAS-para-ChatGPT.md` foi integrada aos arquivos compartilhados `../nova-versao/transicoes.js` e `../nova-versao/melhorias.css`.

O ZIP enviado usa uma versão anterior da seleção de fases e de Sobre o jogo. Foram aproveitadas as alterações de efeito, mantendo o mapa original, o colar remodelado e os sprites já adicionados.

A rajada tem 16 folhas de 40–76 px no celular ou 28 de 56–112 px em telas maiores. O tempo de saída foi ajustado para permitir a animação de 1300 ms inteira. Na chegada, as folhas têm uma camada temporária independente do círculo, sem bloquear os botões. Movimento reduzido continua sem folhas.

Com o servidor HTTP ativo, a ferramenta `playwright-core` instalada fora do projeto e Chromium disponível:

```sh
NODE_PATH=/tmp/guardiao-validacao/node_modules GUARDIAO_TEST_URL=http://127.0.0.1:8000/tela-inicial/nova-versao/ node tela-inicial/efeitos-folhas/validacao/folhas.cjs
```

O script verifica quantidade e tamanho, opacidade e contraste, deslocamento real das folhas, todos os eventos de conclusão antes de navegar, camada da chegada após a abertura do círculo, interação com os botões durante a rajada e remoção das partículas ao final ou ao ativar movimento reduzido. Usa 1280×720 e 390×844 com toque emulado.

A animação de folhas de fundo e as artes originais do mapa/colar não foram modificadas nesta correção. Não há dependência nova para executar o jogo.
