# Revisão da Floresta Viva

Esta pasta concentra a revisão visual, a navegação e a interface. Os arquivos e pastas anteriores continuam preservados. A entrada permanece em `jogo/floresta-viva/index.html`.

- `navegacao.js`: áreas de chão, pegadas da cabana/abrigo/troncos/Carlos e elipse da cisterna. Corpo circular de 8 unidades nos pés. O rio é sólido, com abertura apenas na ponte. Uma grade de 8 unidades encontra rotas por A*, evita cortar quinas e simplifica segmentos visíveis. Kai e os animais compartilham essas rotas.
- `floresta-colisoes.tmj`: referência visual para o Tiled, com cenário, objetos sólidos, rio, ponte e áreas de chão. A fonte executada continua sendo `navegacao.js`; as coordenadas do editor usam a resolução da pintura, com as dimensões lógicas registradas nas propriedades.
- `interface.css` e `interface.js`: missão recolhível, controles de natureza, avisos curtos, ajuste quando Kai está perto do alto da tela, pausa e conclusão. Lados e tamanho dos controles seguem Configurações.
- `assets/`: floresta ilustrada antes/depois, 13 pranchas e os metadados dos **128 quadros**. Os PNGs originais não são alterados pelo gerador.
- `atlas.js` substitui os metadados das pranchas anteriores em memória e acrescenta cuidados e fogo. `gerar-atlas.py` calcula limites e pivôs a partir da transparência; requer Pillow apenas para manutenção dos metadados.
- `validacao/revisao.cjs`: navegador Chromium, comandos reais, cenários de colisão independentes, ciclo completo, ida dos animais pela ponte, cor real do prêmio, pausa, conclusão, mapa, seis prévias, toque simultâneo, preferências, falhas e subpasta do Pages.

## Quadros

| Prancha | Quantidade | Ação |
|---|---:|---|
| Kai com mangueira | 16 | Oito direções e variações |
| Kai caminhando | 16 | Passos nas oito direções |
| Kai em repouso | 8 | Direções, respiração e piscar |
| Kai na premiação | 8 | Receber, erguer, vestir e celebrar o fragmento vermelho |
| Kai cuidando | 12 | Retirar mangueira e usar kit de resgate |
| Flora | 12 | Voar, pousar, descansar e comemorar |
| Animais | 24 | Feridos, tratados, saudáveis e em movimento |
| Carlos | 8 | Conversar, entregar itens, fragmento vermelho e celebrar |
| Natureza | 8 | Árvores, folhas e flores |
| Equipamentos e água | 8 | Mangueira, kit, fragmento, mochila e quatro jatos |
| Fogo | 8 | Ciclo de chamas |

## Fluxo de conclusão

Depois dos oito focos e três animais seguros, Kai recebe uma rota até Carlos. Ao chegar, a sequência de 6,5 segundos entrega o cristal **vermelho**, mostra as oito poses e celebra com Flora. Só então grava a conquista e abre a tela de resultados. O botão Próxima aventura mostra a recuperação da região e seleciona Rio Poluído; essa próxima fase continua em desenvolvimento.

As chaves de progresso anteriores foram mantidas. Saves que colocavam Kai dentro de uma nova colisão o reposicionam no início seguro. Fechar a conclusão, inclusive com Escape, restaura a exploração e permite que Flora volte a pousar.

## Conferir

```sh
npm run dev
node jogo/floresta-viva/revisao/validacao/revisao.cjs
```

Para inspecionar pegadas e colisões, abra `jogo/floresta-viva/index.html?colisoes`. Essa visualização não faz parte da interface normal.

As opções de movimento reduzido e tamanho do texto são respeitadas. Os sons dependem do primeiro gesto permitido pelo navegador. Sem armazenamento, a aventura funciona na aba atual e informa que não conseguiu salvar.
