# Revisão da campanha e modo paisagem — 04/11/2026

Revisão jogável a partir de `0ed8f9e`, atendendo ao pedido de percorrer o jogo inteiro, conferir colisões, posições dos personagens, recortes, textos e alinhamentos e fazer a aventura funcionar com a tela deitada.

O código novo fica em `jogo/revisao-paisagem/`. As sete páginas de entrada carregam essa revisão. Os controladores anteriores, artes originais, progresso existente e nomes dos créditos permanecem no repositório.

## Problemas reproduzidos e correções

| Área | Problema encontrado | Correção |
| --- | --- | --- |
| Orientação | A campanha continuava ativa em retrato, com pouco espaço para controles e informações. | Paisagem em todas as entradas. Em retrato, um aviso pede a rotação; posição, relógio, conversa e ações ficam preservados até voltar à paisagem. O botão tenta tela cheia e bloqueio de orientação quando o navegador oferece essas APIs. |
| Câmera | Um celular deitado com largura menor que 700 px usava um zoom muito alto. | Escala baseada na altura disponível, com acompanhamento e limites do próprio cenário. |
| Pausa | As opções inferiores ficavam fora da tela em celulares deitados. | Duas colunas com resumo, escolha do dispositivo e todas as ações visíveis. |
| Botões de toque | Pulo e ajuda podiam se sobrepor; pausa era pequena. | Duas fileiras separadas, alvos de pelo menos 44 px e suporte ao controle pela mão esquerda. Pulo usa a imagem de Kai. |
| Falas e avisos | O deslocamento horizontal herdado levava a fala da Flora sobre o joystick e Kai. | Área inferior entre os controles, com largura limitada e transformação corrigida. |
| Nomes e textos | Rótulos na borda do cenário podiam sair da tela ou ficar cobertos por Flora/HUD. | Etiquetas desenhadas sobre os sprites, dentro da área visível e fora dos controles; quebra de texto nas caixas e botões. |
| Mochila | Cabeçalho, abas e rodapé tomavam quase toda a altura; ícone invadia o nome. | Cabeçalho compacto, ícones limitados, área real de rolagem e três abas acessíveis. |
| Seleção da fase | Botão de entrada ficava depois de um conteúdo longo, inclusive no tablet. | Cabeçalho e ação fixos dentro do painel, com informações no centro rolável. |
| Placas do mapa | Rio e fauna se sobrepunham com 320 px de altura. | Três alturas distintas; o rodapé compacto mostra progresso sem repetir a lista de destinos. |
| Retratos da seleção | Botas e pés de quadros vizinhos apareciam acima/abaixo de Kai e do NPC. | Recorte SVG no retângulo do quadro, além do limite do viewport; NPC, fala e Kai centralizados. |
| Caminho do resgate | Kai travava numa quina antes da capivara na fase 1. Os extremos eram válidos, mas a linha cruzava uma faixa bloqueada. | Visibilidade verificada a cada unidade; cada ligação da grade usa a mesma colisão do movimento. A rota contorna a quina. |
| Reservatório | Travessia e cisterna precisavam respeitar o chão desenhado. | Reservatório sólido e travessia pela ponte. A regressão confere pontos dos dois lados e o rio fora dela. |
| Moradores | Um morador do rio sobrepunha o início; um morador da cidade ocupava um objetivo. | Posições compartilhadas entre desenho e colisão, fora do início e das atividades. |
| Profundidade | Moradores eram pintados por cima de Kai independentemente da posição. | Kai, NPCs, animais, moradores e copas usam a ordenação pela posição dos pés. |
| Rio | Píer/ponte podiam acionar natação; existia obstáculo invisível na água e faltavam rochas reais. | Margem, ponte, píer e rochas ajustados ao cenário; removido o obstáculo invisível. |
| Fauna | Cercas não bloqueavam o movimento/interação; mico e passarinho estavam mal posicionados. | Barreiras com abertura dos portões, aproximação pelo lado acessível e objetivos reposicionados. O tronco segue a base da árvore. |
| Animais resgatados | Ao recarregar, o animal seguro reaparecia na antiga posição de resgate. | Restauração da posição do habitat no carregamento, com regressão na campanha inteira. |
| Habitat | O destino do tamanduá encostava numa cerca. | Novo ponto seguro e teste de acesso aos nove habitats, sem salto da rota para a posição final. |
| Plantio | Fonte não correspondia à base desenhada; escolhas de plantas destoavam do cenário. | Colisão da fonte corrigida; 12 quadros ilustrados de ipê, ingá e aroeira, usados na escolha e no crescimento. |
| Cidade | Cercas/canteiros atravessáveis; material numa cerca; canal e ponte sem correspondência completa com o chão. | Canteiros e cercas sólidos, material acessível, canal bloqueado para caminhada e ponte utilizável. |
| Resíduos | Papel sujo e esponja tinham a aparência de outra categoria. | Desenhos próprios de papel sujo e esponja usada, mantendo a separação em rejeitos. |
| Conclusão | A comemoração podia usar arte antiga dos animais; moradores ficavam felizes antes dos resgates terminarem. | Amigos saudáveis usam as pranchas atuais; grupos alternam na festa da fauna. Humor considera todos os objetivos. |

## Organização

- `orientacao.js` e `paisagem.css`: orientação, áreas seguras, controles, diálogos, pausa, mochila, seleção e créditos.
- `interface.js`: extensão da interface compartilhada; agrupa a pausa, mantém a ação do painel acessível e recorta os retratos.
- `elenco.js`: posições dos moradores e habitats usados pelo jogo e pela verificação de colisões.
- `geometria.js`: geometria das fases 2–5; cercas, água, travessias e alcance da interação.
- `navegacao.js` e `floresta-colisao.js`: rotas com verificação das ligações reais entre os pontos.
- `floresta.js`, `campanha.js`, `epilogo.js`: entradas da campanha que aplicam orientação, câmera, profundidade, posições e persistência.
- `arte.js`, `plantas.js`, `plantas-atlas.js`, `assets/`: desenhos, recortes completos das plantas e sprites correspondentes.
- `validacao/`: percurso das cinco fases, interface em cinco dimensões, colisões e regras da campanha consolidada.

## Artes das plantas

`fontes/plantas-nativas.png` é a prancha original de 12 poses: broto, muda, árvore e variação de movimento para três espécies. `fontes/paisagem-plantas.svg` contém a composição com as silhuetas completas. `preparar.py` usa o empacotador existente, Inkscape e WebP para gerar o atlas público. Python mede a transparência; a composição/exportação é feita pelas ferramentas de desenho.

## Como verificar

```sh
npm ci
npm run build
npm run check:site
npm run test:build
```

Para executar apenas o percurso completo contra um servidor já iniciado:

```sh
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ \
node jogo/revisao-paisagem/validacao/campanha.cjs
```

`GUARDIAO_TEST_MODE=mobile` ou `desktop` seleciona o dispositivo. A validação de interface aceita `GUARDIAO_CAPTURE_DIR` para salvar capturas. Os testes visuais usam salvamentos preparados apenas para inspecionar telas desbloqueadas; o teste de campanha começa do início e conquista os objetivos por ações do jogo, incluindo coleta, resgates, perguntas, plantio, reciclagem, cristais e epílogo.

## Limites da verificação

Os percursos e capturas são feitos no Chromium com teclado e emulação de toque. Isso permite reproduzir rotas, inspecionar quadros, medir caixas e verificar erros de JavaScript/arquivos ausentes, mas não substitui uma sessão num aparelho Android/iPhone real. O Safari pode exigir rotação manual: por isso o aviso funciona mesmo quando o navegador não oferece bloqueio de orientação. A lista descreve problemas efetivamente reproduzidos e corrigidos; não é uma garantia de ausência de qualquer outro defeito.

O ponto da grade mais próximo é procurado em ordem de distância. Assim, a verificação precisa das quinas não dispara centenas de raios longos desnecessários a cada clique de orientação.
