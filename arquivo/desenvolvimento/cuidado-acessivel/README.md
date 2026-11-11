# Cuidado acessível — revisão de 09/11/2026

O código novo está em `jogo/cuidado-acessivel/`. Os controladores anteriores e todos os assets originais foram preservados.

- Enter realiza a ação do contexto: conversar, receber equipamento, abrir água, segurar a mangueira, recolher resíduos, responder às perguntas e cuidar. Os botões mantêm sua ativação nativa. Nas configurações, Enter também alterna os interruptores; setas navegam pelas abas e opções das perguntas.
- Configurações separadas em Áudio, Conforto e Controles. Removidos os links Conhecer o jogo e Ver as missões solicitados. Preferências continuam persistidas.
- Resposta correta na fauna já recupera o animal e inicia seu retorno ao habitat. A confirmação extra foi retirada. Resposta errada mantém a pergunta disponível.
- Reflorestamento com duas ações: plantar e regar. A espécie varia entre ipê, ingá e aroeira. Sem janela para escolher a muda, etapas de cavar/limpar ou necessidade de segurar o regador no teclado. O regador existente do celular continua disponível.
- Removida a sobreposição móvel de recortes do fundo, que fazia a árvore da fauna parecer desaparecer e reaparecer. A pintura permanece inteira. As plantas cuidadas não criam novas barreiras que prendem Kai. Reservatório, edifícios, cercas, rochas e tronco grande continuam sólidos; lixeiras receberam colisão junto à base. Os animais já acolhidos não bloqueiam a rota da floresta.
- Seis moradores/aliados em cada fase, com modelos variados dos NPCs do jogo, poses de reação e dicas curtas. Os mesmos pontos usados para desenhar os pés definem suas colisões.
- Lixeiras com volume, tampas, rodas, detalhes de madeira e identificação por símbolo/categoria. Novas mudas de ipê, ingá e aroeira com tronco, folhas e flores/frutos, balanço e crescimento. SVGs são gerados em `artes.js` e carregados uma vez, sem novas dependências.
- 70 WebP reprocessados: dimensões e alfa preservados. O conjunto passa de 37.583.748 para 25.102.396 bytes (33,2% de redução). Os arquivos servidos usam os mesmos quadros, pivôs e hitboxes. O mapeamento fica em `otimizados.js`; `otimizar.py` reproduz os arquivos e verifica o alfa. A grade de colisão dinâmica é reaproveitada quando os bloqueios não mudam. A resolução do canvas é limitada a 1,5× em telas de toque.

## Autoria e fotografias

A seção Sobre Nós identifica Iuri Barroso Nascimento e Hicham Mohamed El Attar corretamente, mantendo Eric, Nadson e o apoio do Professor Peterson Lobato. As fotografias originais dos criadores não estavam disponíveis no workspace; os arquivos existentes são ilustrações. Não foram apresentadas ilustrações como se fossem fotos. A inserção das fotografias depende de elas serem anexadas novamente.

## Verificação

Com o preview em execução:

```sh
npm run build
npm run check:site
node jogo/cuidado-acessivel/validacao/colisoes.cjs
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/cuidado-acessivel/validacao/campanha.cjs
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/cuidado-acessivel/validacao/interface.cjs
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/cuidado-acessivel/validacao/configuracoes.cjs
```

As campanhas de teste usam contextos isolados e ações reais. A redução dos bytes baixados nas fases pode ser medida separadamente do tamanho dos arquivos em disco. Capturas: `node desenvolvimento/cuidado-acessivel/capturar.cjs <pasta>`.
