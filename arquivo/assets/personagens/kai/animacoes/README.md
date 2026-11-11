# Kai — caminhada, salto e repouso

Conjunto final de **24 quadros** com transparência, integrado em **Sobre o jogo → Como jogar**:

| Animação | Quadros | Uso |
|---|---|---|
| Caminhada | 12 | Pernas alternadas, movimento dos braços, capa e mochila |
| Salto | 8 | Preparação, impulso, subida, ápice, queda, aproximação do chão, aterrissagem e recuperação |
| Repouso | 4 | Parado, respiração, sorriso e piscada |

A arte foi gerada a partir da prancha aprovada `../../../../tela-inicial/mapa-interativo/assets/02_kai_dialogo.png` e da ilustração `../../../interface/kai-pulando.png`, preservando a roupa, o cabelo, a capa e a mochila. As duas pranchas PNG foram copiadas sem alterações dos arquivos gerados. Os originais também foram preservados no ambiente de criação.

## Arquivos

- `kai-caminhada.png`: versão final da caminhada, em quatro colunas por três linhas. As margens verticais reais foram conferidas; não se deve dividir a altura igualmente sem consultar o atlas.
- `kai-acoes.png`: prancha original em seis colunas por quatro linhas. Salto nos índices 12–19 e repouso nos índices 20–23, contados a partir de zero. As duas primeiras linhas são o estudo inicial da caminhada; a animação em produção usa a prancha revisada acima.
- `atlas.json`: limites, pivôs, escalas e sequências dos 24 quadros finais.
- `atlas.js`: os mesmos dados em script clássico para hospedagem estática.
- `quadros/`: 24 recortes SVG individuais, com pivô e escala normalizados em uma janela de 104 × 100. Eles referenciam os PNGs da pasta superior; mantenha essa estrutura ao copiar os arquivos.

Os personagens olham para a direita nas pranchas. O jogo espelha a composição para andar à esquerda. A altura de referência é de 80 px; os pés usam o mesmo ponto de apoio entre poses, evitando oscilar por causa das margens ou do tamanho da capa.

O gerador `../../../../desenvolvimento/sprites-kai/gerar-atlas.py` analisa o canal alfa com Pillow e escreve somente os metadados e os SVGs; não altera pixels dos PNGs. Execute-o na raiz com:

```sh
python3 desenvolvimento/sprites-kai/gerar-atlas.py
```

## Integração

O renderizador está em [`../../../../jogo/personagens/kai/`](../../../../jogo/personagens/kai/README.md). A caminhada acompanha a distância percorrida; o salto acompanha a física e não repete a sequência no ar. O repouso pausa quando a aba está oculta ou o usuário solicita movimento reduzido. As interações essenciais de movimento e pulo continuam disponíveis.

`npm test` e `npm run test:build` verificam que todos os 24 quadros aparecem no jogo, que os pixels mudam durante a caminhada, a seleção de poses do salto, apoio/limites dos quadros, direção, parada, toque, pausa e falha de imagens.
