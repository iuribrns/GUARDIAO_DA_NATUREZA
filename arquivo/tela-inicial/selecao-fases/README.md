# Seleção de fases — mapa e progresso

A entrada continua em `../nova-versao/aventura.html`, aberta pelo botão **Jogar**. Esta pasta mantém as pinturas e o controle de progresso. As camadas interativas, o zoom e os seis painéis completos estão em [`../mapa-interativo/`](../mapa-interativo/README.md).

## Fidelidade à referência

Os quatro arquivos em `assets/` foram copiados sem alteração de `mapa-ilhas-transicao.zip`:

- `mapa-inicial.png` — 1672 × 941, Kai na Floresta em Chamas e fases 2–6 bloqueadas.
- `mapa-apos-fase-1.png` — 1672 × 941, floresta verde, confirmação de conclusão e Kai no Rio Poluído.
- `transicao-fase-1.gif` e `transicao-fase-1.mp4` — prévias originais preservadas; não são baixadas automaticamente pela interface.

As placas, os nomes das fases, os caminhos, o retrato de Kai e os biomas continuam nas pinturas originais. Os seis botões transparentes ficam sobre as placas, além do botão Voltar já desenhado no mapa. O mapa inteiro respeita sua proporção. A camada nova acrescenta correntes, ondulações, brilho do fogo, fumaça e energia do portal. É possível ampliar e arrastar a ilha; **Ver ilha inteira** restaura o enquadramento.

A restauração usa uma dissolução de opacidade de 1,6 segundo entre as duas pinturas, como descrito na referência. Pequenas diferenças entre os desenhos são as dos arquivos fornecidos. Com movimento reduzido do sistema ou do menu, a passagem usa apenas opacidade por 240 ms. A interface mantém foco, teclado, leitura por tecnologia assistiva e áreas de toque de pelo menos 44 px.

No celular em pé, a ilha aparece inteira; uma lista abaixo oferece os mesmos nomes e estados em tamanho de leitura confortável. Em telas largas e no celular deitado, a pintura ocupa a área disponível, sem essa lista adicional.

## Seleção, recuperação e progresso

Tocar em uma região abre os detalhes da missão. Somente fases liberadas mudam a localização de Kai. A fase 1 pode ser revisitada após a recuperação: a floresta continua verde e o retrato volta à região 1. Essa composição de revisita usa recortes SVG das duas pinturas originais; os arquivos de imagem permanecem intactos.

As fases jogáveis continuam em desenvolvimento. O botão **Ver recuperação da floresta**, nos detalhes da fase 1, demonstra a animação e o desbloqueio do Rio Poluído. Essa prévia é temporária, não grava conclusão e não altera o progresso real. **Voltar ao progresso salvo**, disponível nos detalhes durante a prévia, encerra a demonstração.

O código da futura primeira fase poderá chamar:

```js
await window.GuardiaoMapa.concluirFase(1);
```

Essa chamada anima a recuperação, libera o rio, move Kai para a fase 2 e salva o estado real em `guardiao.mapa.progresso.v1`. A seleção de uma região já liberada atualiza a posição persistida:

```js
window.GuardiaoMapa.selecionarFase(1); // Revisitar a floresta, mantendo-a verde.
window.GuardiaoMapa.obterProgresso(); // { completedFirst, current, preview }
```

`obterProgresso()` retorna o progresso real e informa se há uma prévia aberta. A localização mostrada na prévia é independente. Apenas a recuperação da fase 1 tem artes de antes/depois neste pacote; as fases 3–6 permanecem bloqueadas, e não são inventados estados de recuperação para elas. A fase 2 pode ser selecionada após a primeira conclusão, mas também ainda não contém gameplay.

O armazenamento bloqueado não impede o uso na aba atual. Se a imagem restaurada falhar, o mapa avisa e não registra a conclusão. Um limite de espera conclui a passagem caso o evento CSS seja interrompido. Completar novamente a primeira fase é idempotente.

## Validação

`validacao/mapa.cjs` usa `playwright-core` e Chromium. Com o servidor HTTP do projeto ativo:

```sh
GUARDIAO_TEST_URL=http://127.0.0.1:5173/tela-inicial/nova-versao/ node tela-inicial/selecao-fases/validacao/mapa.cjs
```

Verificações: bloqueios, seleção, restauração com opacidade intermediária, prévia sem conclusão falsa, persistência, revisita, navegação pelo menu, colar remodelado, larguras de 320/390/667 px, movimento reduzido, armazenamento bloqueado, progresso inválido e erro de imagem.

Os PNGs de referência continuam intactos. A interface atual acrescenta camadas animadas e controles sobre a pintura; suas capturas já não têm a comparação pixel a pixel da primeira versão sem camadas.
