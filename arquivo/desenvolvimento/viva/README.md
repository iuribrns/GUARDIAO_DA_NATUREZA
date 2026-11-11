# Revisão Viva

Entrada atual: `jogo/viva/index.html`. Esta pasta reúne a compilação, as medições e os testes da revisão visual de novembro de 2026.

## O que mudou

- Abertura pintada com Kai de costas em três quartos, voltado à Árvore Guardiã, colar na mão e Flora no ombro. Sem personagem sobreposto à imagem.
- Moldura de madeira ilustrada nos botões principais, folhas do material original e transição de copa entre telas.
- Ilha inteira ajustada à tela, com camadas coincidentes e somente cinco regiões. O encerramento acontece no mesmo mapa: Kai percorre os caminhos, ergue o colar e restaura a árvore. Não carrega um filme.
- Seis cenários à altura dos personagens para encontros e demonstração dos controles. Kai e o aliado olham um para o outro; Flora fica ao lado, sem cobrir os rostos.
- Retrato aprovado do Professor Peterson restaurado. Ilustração e comandos reais na demonstração de movimento.
- Ajustes em quatro abas: áudio, conforto, controles e imagem; qualidade gráfica altera a resolução real dos canvases. Os ajustes dentro da fase preservam a sessão.
- Símbolos vetoriais próprios para água, fogo, animais, floresta e cidade. Não dependem de emojis do sistema nem dos antigos bancos de ícones raster.
- Kai e os aliados principais maiores, com os pés no mesmo ponto físico. Sem os moradores adicionais; eles também saem da geometria de colisão. Quatro animais na fase da fauna, além da chave.
- Sprites são carregados conforme a tela precisa. A publicação estática exclui laboratórios, fontes de criação, o vídeo substituído e artes sem uso; os arquivos originais permanecem no repositório.

## Executar e verificar

```sh
npm ci
npm run dev
npm run build
npm run check:site
npm run test:build
```

`npm test` verifica o servidor de desenvolvimento; `npm run test:build` verifica `dist/`, inclusive em uma subpasta equivalente à do GitHub Pages. É necessário Chromium (`CHROMIUM_PATH` permite mudar o executável).

A campanha automatizada percorre caminhos e realiza as ações reais, primeiro com teclado e depois com eventos de toque. O teste visual do final prepara o progresso para conferir a composição em cada etapa; a campanha completa conquista o mesmo progresso jogando.

`publicacao.mjs` gera o manifesto; `compilar.mjs` copia os arquivos listados, sem empacotar os laboratórios. `verificar-site.mjs` confere referências e limites dos quadros. `medir-carregamento.cjs` registra os bytes recebidos em uma visita nova, sem cache.

As artes WebP prontas e seus limites medidos estão em `jogo/viva/assets/`; não é necessário gerar imagens para compilar. `preparar.py` documenta a conversão das fontes desta sessão, que ficam fora da publicação.

## Limites da conferência

A validação usa Chromium desktop e emulação de toque em paisagem; não substitui uma rodada em aparelhos Android e iOS reais. A medida de bytes não é uma promessa de tempo de carregamento ou de FPS em qualquer dispositivo.
