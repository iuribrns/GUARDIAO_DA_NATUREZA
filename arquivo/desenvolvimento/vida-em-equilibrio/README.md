# Vida em equilíbrio — plano consolidado de 02/11/2026

Implementação do novo documento, partindo de `df61260`. O texto e o DOCX recebidos estão nesta pasta. Esta etapa substitui as decisões anteriores de plantio em várias etapas, escolha livre de roupas e atividades extras da cidade. Os controladores e ativos anteriores permanecem no repositório.

## Entradas e preservação

O código novo está em `jogo/vida-em-equilibrio/`; os arquivos de criação estão em `desenvolvimento/vida-em-equilibrio/`. As páginas existentes carregam esses controladores. Bancos de sprites, áudio, física e estilos aprovados são reutilizados pelas suas URLs anteriores. `tela-inicial/nova-versao/index.html` não foi alterada. A seção `Sua missão` de Sobre o jogo permanece igual à versão anterior.

## Decisões do plano e implementação

| Área | Resultado |
| --- | --- |
| Configurações | Controles primeiro, alvos confortáveis ao toque, detecção de telas sensíveis ao toque mesmo com trackpad/ponteiro fino, preferência manual persistente ao girar a tela e recarregar. |
| Sobre o jogo | História com etapas e origem do amuleto mais legíveis; Kai maior e completo na demonstração; biomas em cartões curtos e cuidados extras recolhidos por padrão; perfis com acabamento comum. Mantidos Iuri Barroso Nascimento, Hicham Mohamed El Attar e Professor Peterson Lobato, conforme os nomes já confirmados na conversa — “Richard” havia sido esclarecido como referência a Hicham. |
| Mapa | Cinco missões e o destino 6, Um Novo Amanhã. O santuário central começa devastado e possui máscara própria; nenhuma conclusão isolada restaura esse centro. As cinco conquistas o recuperam e liberam o epílogo. Não há batalha ou missão adicional. |
| Mochila | Ferramentas com novos vetores, cinco cristais com silhuetas e símbolos diferentes e roupas com as próprias imagens dos trajes. Uniformes são somente consulta. Cada fase usa o traje correspondente automaticamente. |
| Fase 1 | Consumo da água passou de 4 para 6 unidades/segundo. Os oito focos exigem pelo menos 133 unidades, em um tanque de 100, mesmo com precisão perfeita. A campanha exige voltar ao registro antes do último fogo. A física, os focos, a mangueira e os resgates existentes foram mantidos. |
| Fase 2 | Dois peixes e a tartaruga têm pranchas próprias com saúde debilitada e recuperação evidente. Oito novas poses frontais compõem o nado para baixo; laterais e nado para cima permanecem. Profundidade, traje obrigatório e regras da fase foram mantidos. |
| Fase 3 | Gato removido da missão e do epílogo. Mantidos mico, tucano, capivara e o passarinho existente. Acrescentadas onça-pintada, arara-azul, tamanduá-bandeira, anta e bicho-preguiça, cada espécie com quatro poses, cuidado e pergunta próprios, explicação e nova tentativa. Os animais retornam a lugares distintos. A copa entre mico e capivara perde opacidade e Kai permanece visível, inclusive com movimento reduzido. |
| Fase 4 | Apenas escolher livremente a imagem de ipê, ingá ou aroeira, plantar e regar. Removidos limpeza, cova, proteção e ninhos como tarefas. Cada opção tem sua imagem própria, usada também no crescimento. Canteiros antigos parcialmente preparados migram sem deixar o jogador preso. A doninha e o cenário aprovado não foram alterados. |
| Fase 5 | Só coleta/separação, painéis solares e jardins. Três lixeiras maiores e identificadas: recicláveis, orgânicos e rejeitos. Kai tem quatro poses próprias manipulando o painel. Jardins crescem; fábricas diminuem a fumaça após as atividades. Não há tarefa industrial, de transporte ou mutirão extra. |
| NPCs | Moradores visíveis nas cinco fases desde o início. Aparência preocupada, esperançosa e feliz acompanha as tarefas concluídas; não foram acrescentadas conversas obrigatórias. |
| Epílogo | Seis cenas mantidas: regiões antes/depois, abraço com Carlos e reencontro, habitats com todos os animais brasileiros, comunidade, cinco cristais/amuleto e festa com a mensagem central. NPCs dos dois lados se orientam para Kai. Acesso pelo destino 6 e controles de pausa/repetição/créditos. |

## Estrutura

- `conteudo.js` aplica o escopo consolidado aos dados anteriores.
- `campanha.js` e `floresta.js` são as novas entradas das fases, sem alterar os controladores preservados.
- `arte.js` estende o banco de arte anterior; `atlas.js` descreve as novas pranchas.
- `controles.js` resolve detecção e escolha explícita do dispositivo.
- `colecao.js` desenha ferramentas, plantas, lixeiras, uniformes e cristais.
- `mapa.js` e `epilogo.js` cuidam do sexto destino, recuperação e encerramento.
- `progresso.js` e `mochila.js` mantêm os mesmos salvamentos e limitam roupas por situação.
- `acabamento.css` acrescenta os ajustes compartilhados para toque e apresentação.

## Artes

44 quadros novos em quatro WebP: 20 de novas espécies brasileiras, 12 de animais do rio e 12 de Kai (oito nadando para baixo, quatro ajustando o painel). Duas pinturas preservam a geografia aprovada da ilha e degradam o santuário central.

Os PNGs originais e SVGs de empacotamento estão em `fontes/`. O script `preparar.py` mede transparência e componentes completos; a composição das pranchas é feita pelo Inkscape e a exportação pelo WebP. Não há recorte arbitrário de cabeças, asas ou ferramentas. Os arquivos de criação não são enviados no build público.

## Verificação

- `validacao/campanha.cjs`: campanha inteira por teclado ou toque, reabastecimento obrigatório, nove animais brasileiros, escolha livre das três plantas, três categorias de resíduos, três atividades urbanas e entrada no epílogo pelo mapa.
- `validacao/interface.cjs`: cinco dimensões de tela, seis destinos alcançáveis, mochila sem desbloqueios falsos, controles, introduções curtas e toque/cancelamento nas cinco fases.
- `validacao/rio.cjs`: pixels da cabeça e do corpo submerso nas oito direções; oito poses distintas nadando para baixo.
- `validacao/plano.cjs`: regras de desbloqueio, centro degradado/recuperado, cristais distintos, roupas somente consulta, três aparências de moradores em todas as fases e detecção de tablet híbrido.

Os testes usam Chromium e emulação de celular; a validação da campanha é feita na cópia de produção. O relatório final registra as execuções efetivamente concluídas.
