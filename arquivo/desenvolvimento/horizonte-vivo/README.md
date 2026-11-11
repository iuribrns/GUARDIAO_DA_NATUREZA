# Horizonte, ilha em tela inteira e celebração no campo

Esta revisão recupera a composição anterior da tela inicial: vale verde, placas originais de madeira clara e Kai contemplando o horizonte com Flora no ombro. Os arquivos públicos novos ficam em `tela-inicial/horizonte-vivo/`; as versões anteriores continuam preservadas.

## Arte e animação

- `fontes/vista.png`: fundo do horizonte, com duas pequenas áreas queimadas distantes. O fogo é desenhado em uma camada separada, usando os quadros completos já existentes.
- `fontes/dupla.png`: quatro poses completas de Kai e Flora juntos, com piscadas, respiração e pequenas reações a mouse, toque e teclado. Flora permanece no ombro.
- `fontes/mapa*.png`: ilha anterior remodelada sem templo ou fase final, em composições próprias para paisagem e retrato; há versões restauradas que só entram após conquistas reais.
- `fontes/campo.png`: campo aberto do encerramento. Kai, Flora, os cinco aliados e os animais são sprites separados; o colar tem os cinco cristais corretos, e brotos e flores acompanham a onda de restauração.
- `assets/placa.svg`: placa original de madeira com folhas, reutilizada nas marcações da ilha e nos controles do encerramento.

As artes-fonte PNG e o SVG de empacotamento são preservados aqui. `preparar.py` exporta WebP com libwebp e empacota as quatro poses com `desenvolvimento/recortes/empacotar.py`. Inkscape compõe os recortes; Pillow/NumPy apenas medem a transparência. Não há ferramenta de edição ou dependência externa executada pelo navegador.

## Telas

- `nova-versao/index.html` carrega `inicio.js` e `inicio.css`, com o logotipo e os botões aprovados anteriormente. As falas breves somem sozinhas.
- `nova-versao/aventura.html` carrega `mapa.js`, `mapa.css` e `flora-mapa.js`. A ilha ocupa todo o viewport, com título, cinco regiões e informações dentro dela. Em retrato, `<picture>` troca a composição para o mapa vertical. As placas inferiores ficam acima das informações, inclusive no celular deitado. Não existe botão de créditos no centro nem sexta fase.
- `renascimento/creditos.html` mantém seu endereço para os links já existentes e carrega `final.js` e `final.css`. A conclusão comprovada da quinta fase restaura sua região e abre a celebração. Os agradecimentos aparecem depois de 17 segundos ou pelo botão “Ver créditos”. É possível pausar, rever a celebração ou voltar à ilha sem alterar a conquista.

As cinco fases e os dados de progresso existentes são mantidos. A restauração continua exigindo a conclusão salva da fase; abrir o mapa ou os painéis não libera conquistas nem mostra antecipadamente a ilha restaurada. Preferências de movimento reduzido e suspensão ao ocultar a página são respeitadas.

## Validação

`node tela-inicial/horizonte-vivo/validacao/horizonte.cjs` usa Chromium real com um servidor local. `GUARDIAO_TEST_URL` permite testar a cópia publicada pelo build. A suíte cobre a animação real, os cinco tamanhos de tela (1280, 390, 320, 844 e 667 pixels), as cinco placas clicáveis, o acesso às configurações, a restauração final, a festa antes dos créditos, pausa/repetição, movimento reduzido e a proteção do encerramento antes das cinco conquistas.

Também são executadas as regressões do menu, das transições, das folhas e do progresso/restauração, além de `npm run build` e `npm run check:site`. Nenhum progresso de jogador real é alterado nos testes: eles usam contextos isolados do navegador.
