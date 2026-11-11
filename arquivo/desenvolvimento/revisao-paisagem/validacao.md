# Relatório de validação — 04/11/2026

Base da revisão: `0ed8f9ed56fecc8180a7f070c3a3bd80f050ad64`.

## Percurso completo

As cinco fases foram percorridas no Chromium com teclado em 1280 × 720 e com toque emulado em 844 × 390. O percurso começa sem progresso, entra pelo menu/mapa, recebe os equipamentos e executa as interações reais. O relógio do navegador é controlado pelo teste para avançar as animações e o movimento; os objetivos não são concluídos por teletransporte ou alteração de seus estados.

| Fase | Percurso concluído |
| --- | --- |
| Floresta em Chamas | Diálogo com Carlos, retirada da mangueira, registro, oito incêndios, retorno para reabastecer, três resgates, recompensa e persistência. |
| Rio Poluído | Proteção para entrar na água, coleta dos oito resíduos, cuidados com os peixes e a tartaruga, fragmento azul e posições seguras mantidas após recarregar. |
| Resgate da Fauna | Chave, nove animais, perguntas com erro/explicação/nova tentativa, rotas até os habitats, recompensa e posições mantidas após recarregar. |
| Reflorestamento | Seis escolhas livres entre ipê, ingá e aroeira, plantio, rega, crescimento e recompensa. |
| Cidade Sustentável | Coleta e separação dos seis materiais em três categorias, dois painéis, dois jardins, recuperação da região e recompensa. |
| Encerramento | Entrada pelo mapa após as cinco conquistas; seis cenas, amuleto completo, comemoração e créditos. Eric e Nadson permanecem presentes. |

O primeiro percurso depois dos ajustes revelou uma quina que prendia Kai antes da capivara. Ela virou uma regressão específica com a posição exata de origem: `(256.5687527170712, 489.5021612856038)`. Depois da correção da visibilidade das ligações, os percursos completos de computador e celular passaram. A campanha foi repetida após a otimização da busca do ponto mais próximo e a correção do habitat do tamanduá, também com resultado positivo.

## Colisões e posições

`jogo/revisao-paisagem/validacao/colisoes.cjs` passou verificando:

- A quina real da capivara e a execução da rota pelo mesmo resolvedor de movimento do jogo.
- Reservatório sólido, ponte livre e rio bloqueado fora da travessia da floresta.
- Margem, rochas, píer e ponte da fase do rio.
- Cercas, portões e interação pelo lado acessível dos animais.
- Os nove habitats da fauna acessíveis, com o final da rota no destino seguro.
- Fonte do plantio, canteiros da cidade e canal com ponte utilizável.
- Moradores sólidos fora do ponto inicial e de objetivos; todos os objetivos alcançáveis.

## Interface em paisagem

`jogo/revisao-paisagem/validacao/interface.cjs` passou em **844 × 390, 667 × 375, 740 × 320, 932 × 430 e 1024 × 768**.

- Seis destinos do mapa alcançáveis e ação de entrada dentro do painel.
- Textos reais dos nomes, botões, introduções e caixas dentro dos limites horizontais.
- Controles separados, com pelo menos 44 px; pausa com todas as opções visíveis.
- Três abas da mochila com área útil de consulta e rolagem.
- Texto ampliado, controle pela mão esquerda e tamanho máximo dos botões.
- Rotação nas cinco fases: posição e relógio congelados; retomada na mesma posição.
- Rotação com conversa aberta: mantém a mesma fala e não pula a introdução.
- Créditos e botões do encerramento contidos na tela.

O teste do horizonte/mapa identificou a sobreposição das placas de rio e fauna em 740 × 320. Após compactar o rodapé nessa altura e separar as três fileiras, o grupo passou, inclusive verificando o mapa ocupando toda a tela e o encerramento desbloqueado pelas cinco conquistas.

Depois da última alteração visual das etiquetas, o build foi atualizado e o grupo completo de interface passou novamente. As capturas dessa versão também foram inspecionadas, incluindo Carlos, Rafael, os cinco inícios, pausa, mochila, seleção da fase, plantas e o aviso de rotação.

## Outros grupos verificados

- Build de produção, entrada pela raiz, Phaser e GSAP do laboratório: **passaram**.
- `npm run check:site`: **passou**, com caminhos relativos, imagens/áudio presentes e arquivos de desenvolvimento privados fora da publicação.
- Plano consolidado, mochila, desbloqueios, fauna, humores e preferência do tablet híbrido: **passaram**.
- Oito direções do nado, rosto visível e transparência da água: **passaram**.
- Equipe animada, galeria horizontal, cumprimentos e referências: **passaram**.
- Física compartilhada, 88 sprites de movimento e 330 quadros completos: **passaram**.
- Mangueira: engates, jato, impacto, toque simultâneo/cancelamento e alternativa sem imagem: **passaram**.
- Áudio: seis músicas, gesto para ativar, volumes, preferências, pausa, cancelamento da mangueira e falha de arquivo: **passou**.
- Colar: cinco cores, início vazio, encaixe, oito poses, toque para continuar e movimento reduzido: **passou**.
- Menu animado, controles e animações do protótipo preservado: **passaram**.
- Percurso do protótipo de área aberta preservado e integração com o mapa atual: **passou**.
- Transições entre páginas em desenvolvimento: **passaram**.
- Folhas de saída/chegada, 16 e 28 elementos, animação inteira e botões acessíveis durante o efeito, incluindo 568 × 320: **passaram**.

As execuções agregadas foram interrompidas por uma falha real no mapa e por verificações antigas que assumiam a largura em retrato: um carrossel já totalmente visível não tem botão de próxima página; o seletor genérico de título também passou a encontrar o aviso de rotação oculto. Essas verificações foram adaptadas para uma largura deitada com carrossel e para o título específico da página. O protótipo preservado também recebeu um seletor preciso para a placa do mapa, pois o rodapé possui outro botão da mesma fase. Os grupos interrompidos e os seguintes foram executados separadamente e passaram. Não foi usado um resultado parcial da execução agregada como indicação de aprovação total.

## Alcance e limitações

Testes executados em Chromium de computador e emulação de celular, com inspeção de capturas do navegador. Não houve sessão num aparelho Android/iPhone físico ou Safari. O bloqueio automático de orientação depende do navegador; quando ele não é oferecido, o jogo continua aguardando a rotação manual em vez de liberar a partida em retrato.

A conferência de texto usa os retângulos dos caracteres. O `scrollWidth` isolado inclui folhas decorativas dos botões e pode indicar uma largura maior mesmo quando o texto cabe; por isso esse valor não foi tratado sozinho como defeito. Os resultados acima descrevem a cobertura efetivamente executada e não garantem ausência de qualquer outro erro.
