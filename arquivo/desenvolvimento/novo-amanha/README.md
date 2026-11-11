# Um Novo Amanhã — implementação do plano completo

O documento enviado pelo autor é preservado em `plano-recebido.txt`. Esta revisão parte do commit `3bebaa3` e mantém a tela inicial aprovada, as cinco regiões do mapa e todos os arquivos anteriores. A fase 6 é um epílogo, sem vilão ou batalha.

## Onde está o código ativo

Os novos módulos e as artes públicas ficam em `jogo/novo-amanha/`. As páginas já conhecidas continuam sendo as entradas do jogo; elas apontam para os novos controladores:

- `campanha.js`: fases 2–5, com as novas ações, perguntas e consequências.
- `floresta.js`: fase 1, mantendo navegação, incêndios, resgates e premiação existentes, com a nova interface e mochila.
- `conteudo.js`: missões e perguntas próprias para cada região.
- `progresso.js`: inventário, uniformes, descobertas e registro das ações concluídas.
- `mochila.js` / `mochila.css`: três abas compartilhadas pelo mapa e pelas fases.
- `interface.js` / `interface.css`: objetivos compactos, conversas isoladas, avisos temporários e pulo no caminho.
- `arte.js`, `atlas.js` e `assets/`: trajes, animais, moradores, reencontro e uniformes.
- `mapa.js` / `mapa.css`: a seleção em tela inteira é mantida; novos sinais de degradação, estados das fases e acesso à mochila.
- `diario.js` / `diario.css`: controles por dispositivo, demonstração, biomas e descobertas educativas.
- `epilogo.js` / `epilogo.css`: seis cenas, resultados salvos, reencontro, habitats, comunidade, amuleto e créditos.

Os controladores anteriores permanecem no repositório como histórico, sem serem carregados em duplicidade nas páginas ativas.

## Implementação por assunto do documento

| Pedido | Resultado concreto |
| --- | --- |
| Tela inicial | Composição do horizonte, Kai, Flora no ombro, fogo distante e botões aprovados preservados. |
| Textos e sprites ao entrar | Diálogos fechados explicitamente ocultos, um diálogo ativo por vez, retratos inteiros com recorte correto e apenas o nome do objetivo mais próximo durante a exploração. |
| Amazônia / fase 1 | Cenário queimado existente, trilhas e ponte preservadas; mangueira retirada da mochila com animação; fogo desaparece e a vegetação retorna; objetivo atual e resumo final. |
| Rio / fase 2 | Entrega do traje, animação de vestir, proteção obrigatória, novos quadros de natação em oito direções, corpo parcialmente atrás da superfície, coleta com aproximação, cuidado dos peixes e retirada do canudo da tartaruga. Água se recupera progressivamente. |
| Fauna / fase 3 | Chave visível para os abrigos, mico-leão-dourado, tucano, capivara, ave e gatinho; alimentação, cuidado veterinário, abertura de cercados e escalada. Perguntas diferentes por espécie, erro sem punição, explicação e novas tentativas. Os animais voltam a lugares apropriados. |
| Reflorestamento / fase 4 | Limpar resíduos, cavar, escolher uma muda adequada ao local, plantar, regar e proteger algumas mudas. Ipê, ingá e aroeira, ninhos, reabastecimento e crescimento visual; espécie e etapa persistidas. |
| Cidade / fase 5 | Coleta seletiva, lixeiras corretas, painéis solares, jardins, ciclovia, transporte público e mutirão. Crianças, moradora regando, ciclista e vizinho mudam de comportamento conforme o cuidado. |
| Pessoas | Moradores preocupados no início, participação e expressões mais felizes após os objetivos; falas de agradecimento e NPCs no encerramento. |
| Progresso | Objetivos, espécies plantadas, equipamentos, proteção e conquistas salvos; restauração no mapa somente após conclusão. Resumo de cada fase e resultados no epílogo. |
| Mochila | Itens com imagem, nome, uso e bloqueios; cristais com significado e amuleto progressivo; uniformes selecionáveis com sprites compatíveis. Troca de abas e fechamento preservam a fase. |
| Fase 6 | Seis cenas: antes/depois; reencontro com abraço de Carlos; animais nos habitats; comunidade; significado do amuleto; comemoração e mensagem final. Pausa, próxima cena, repetição e créditos. |
| História | Carlos guarda o antigo amuleto dos cuidadores. Os cinco cristais lembram ações e aprendizados. Kai o mantém como compromisso; colaboração e regeneração da natureza explicam a recuperação. |
| Como jogar | Celular e computador separados, joystick, WASD/setas, E, equipamento, J, mochila e pausa; demonstração com Kai inteiro. |
| Na natureza | Seis biomas brasileiros, animais, poluição, espécies nativas, mobilidade e cuidado cotidiano; pergunta com feedback e nova tentativa. |
| Sobre Nós | Iuri e Hicham remodelados em oito poses completas, cabelo e características mantidos, referências ao lado; professor preservado. Nenhum avatar de Raul ou IA foi acrescentado. |

## Artes e ferramentas

`fontes/` guarda as imagens originais geradas para o projeto. `preparar.py` mede transparência e separa as silhuetas completas, sem cortar cabeça, membros, asas, animais ou ferramentas. Inkscape faz a composição das pranchas, e libwebp exporta cores em alta qualidade e transparência com margem de 12 pixels. O navegador recebe WebP, não os PNGs originais.

São 136 novos quadros de jogo em nove pranchas, mais oito poses remodeladas dos estudantes. As duas novas pinturas da ilha preservam a geografia e a posição das cinco regiões. `icones.py` produz 24 símbolos vetoriais próprios: gota de água, pata, mão, proteção, mochila, sementes, transporte e outros.

A interface e as imagens aprovadas anteriormente, incluindo o professor, não são apagadas. Os arquivos de criação ficam fora das pastas copiadas para o site público pelo build.

## Progresso e compatibilidade

A chave `guardiao.amanha.memoria.v1` acrescenta inventário e consequências aos salvamentos existentes. O progresso das cinco fases continua em `guardiao.mapa.progresso.v1`; o salvamento individual de cada fase conserva seu endereço e versão. Perfis anteriores mantêm conquistas e equipamentos já recebidos. Estados novos dos canteiros incluem preparação, cova, semente e proteção. A roupa do rio é obrigatória durante a atividade; selecionar outra roupa não remove essa proteção.

O amuleto não concede vitórias: os cristais vêm da conclusão real das fases. Abrir a mochila, olhar uma região ou responder uma pergunta isolada não termina uma missão. O epílogo exige as cinco conquistas.

## Validação

- `validacao/campanha.cjs`: campanha completa do início ao fim, com navegador real e ações de teclado ou toque; inclui erro/tentativa, proteção, coleta persistida, todas as etapas de plantio, reciclagem, moradores, recompensa e as seis cenas do epílogo.
- `validacao/interface.cjs`: cinco formatos de tela, cinco regiões alcançáveis, mochila sem desbloqueio falso, três abas, controle por dispositivo, biomas, retratos, uma conversa por fase, toque/cancelamento e proteção do final.
- Regressões existentes: movimento e colisões, cisterna e ponte, mangueira, sprites completos, áudio, folhas, transições, menu, equipe e restauração.
- `npm run build` e `npm run check:site`: compilação, arquivos públicos, caminhos relativos e integridade dos ativos usados pelo jogo.

Os testes usam contextos isolados do Chromium, inclusive emulação de celular. A campanha também é executada na cópia de produção. Os registros finais de execução são consolidados em `validacao.md`.
