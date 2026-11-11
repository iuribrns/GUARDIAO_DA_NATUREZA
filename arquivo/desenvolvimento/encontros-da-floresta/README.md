# Encontros, proporções e cristais

Revisão visual de 04/11/2026 para corrigir molduras esticadas, alinhamento e personagens que olhavam para direções incompatíveis durante os encontros. Nenhuma pasta anterior foi apagada.

As placas usam madeira em textura de tamanho fixo, bordas próprias e folhas separadas. Texto e conteúdo definem o tamanho do componente. As ilustrações dos personagens usam `object-fit: contain`; as duas poses compartilham exatamente a mesma câmera, para que a piscada não altere escala ou enquadramento.

Foram criados seis encontros em duas poses cada: Kai com Carlos, Antônio, Marina, Rafael, Luciana e Flora. Kai fica à esquerda, voltado ao aliado, com entrega de equipamentos e contato visual. As legendas usam a mesma altura e a mesma estrutura. Os cinco primeiros encontros aparecem também nas conversas da fase. No cenário, a direção visual de Kai é ajustada durante a conversa e os aliados se voltam para o lado em que ele está; os dados de posição, direção salva e colisão não são alterados.

Os cinco cristais ganharam materiais facetados nas cores vermelha, azul, amarela, verde e violeta. A montura do colar foi pintada novamente. Os encaixes reais dessa pintura definem as silhuetas dos fragmentos, de modo que as peças da seleção, da mochila, da premiação e do epílogo sejam as mesmas. O primeiro colar começa vazio e somente os cuidados conquistados são mostrados. A imagem da recompensa fica contida na sua área, sem atravessar o cabeçalho ou o botão.

## Estrutura e autoria

- `jogo/encontros-da-floresta/`: código e arte públicos.
- `fontes/`: imagens originais, seleções vetoriais, texturas e fragmentos exportados.
- `preparar.py`: mede silhuetas e encaixes com NumPy/SciPy/Pillow; compõe e recorta no Inkscape e exporta WebP. Os pixels das imagens não são pintados ou recortados por Python.
- `capturar.cjs`: capturas das seis seleções, cinco conversas, jogo, pausa e mochila.

Para reproduzir os assets, execute `python3 desenvolvimento/encontros-da-floresta/preparar.py`. Os originais são ilustrações geradas para o projeto, baseadas nos personagens existentes. As texturas da madeira e do papel e os ramos são SVG com dimensões fixas. A montura e os cristais compartilham `assets/atlas.json`. A renderização do jogo exige apenas o navegador.

## Verificação

```sh
npm run build
npm run check:site
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/encontros-da-floresta/validacao/interface.cjs
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/encontros-da-floresta/validacao/arte.cjs
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/encontros-da-floresta/validacao/colar.cjs
```

Inicie o preview com `npm run preview` antes dos testes. Os validadores estão registrados em `npm test`. O progresso existente, a música única, os efeitos sonoros e as preferências foram mantidos.
