# Floresta em Chamas — área aberta

Primeira fase jogável da campanha, em **2D isométrico**. A referência enviada pelo usuário orienta a cabana de Carlos, a barragem com registros vermelhos, a cachoeira, a ponte, os penhascos, a escadaria, a floresta queimada e a interface de madeira. O cenário foi recriado sem personagens ou interface pintados no fundo. Movimento, fogo, água e resgates acontecem em tempo real; não são uma reprodução de vídeo ou GIF.

## Entrar e jogar

Menu → Jogar → Floresta em Chamas → **Entrar na floresta**. Também é possível abrir `index.html` desta pasta em um servidor estático.

- Joystick: movimento nos dois eixos. No computador: WASD ou setas.
- Mão / E: abrir o registro, abastecer, conversar com Carlos e resgatar os animais próximos.
- Mochila / B: escolher a mangueira, que sai da mochila até a mão em uma animação curta.
- Água / espaço: manter pressionado para lançar água e apagar o foco mais próximo ao alcance. Sem água liberada ou reservatório vazio, o fogo não recebe dano.
- Toque nas missões ou peça ajuda a Flora para seguir uma rota pelas trilhas. O joystick interrompe o deslocamento assistido a qualquer momento; não há teleporte.
- Pausa / Escape: continuar, expandir tela, recomeçar esta fase ou voltar ao mapa.

Há oito incêndios e três animais (capivara, cervo e passarinho). Os animais só podem ser resgatados depois de apagar os focos ao redor. Flora acompanha Kai, muda de posição para orientar o caminho e se aproxima dos animais no resgate. As orientações são diálogos escritos, sem dublagem. Os animais resgatados seguem pelas trilhas até o acampamento. A vegetação brota nos pontos apagados.

Os dados de fogo, resgates, água, equipamento e posição usam `guardiao.area-aberta.floresta.v1` no armazenamento local. A conclusão real libera o Rio Poluído no mapa existente (`guardiao.mapa.progresso.v1`). As fases 2 a 6 continuam em desenvolvimento; o desbloqueio não cria uma fase jogável fictícia. Recomeçar limpa somente esta execução da floresta; preserva as conquistas já registradas no mapa. Sem acesso ao armazenamento, a fase funciona na aba e informa a limitação.

## Estrutura e execução

- `mundo.js`: nós, larguras das trilhas, colisão por corredores, rotas por menor distância, posições de incêndios/animais e recortes dos habitantes.
- `fase.js`: movimento, câmera, física de interação, joystick multitouch, animação, água, resgate, missões, persistência e retorno ao mapa.
- `fase.css`: painel e botões de madeira, retrato/paisagem e áreas de toque. A câmera acompanha Kai no celular; em paisagem mostra mais do cenário.
- `assets/`: cenário, habitantes, oito quadros de fogo e oito poses de Kai de frente/costas. As pranchas PNG são originais geradas para esta fase; `kai-direcoes.js` apenas descreve recortes e pivôs calculados pela transparência, sem alterar os pixels. `kai-equipamento.js` reutiliza oito quadros da prancha já existente `../../assets/itens-remodelados/kai/01_mangueira.png`: seis poses de retirar o equipamento e duas de segurar/apontar a mangueira. Os 24 quadros anteriores de caminhada lateral/repouso/pulo foram preservados e o renderizador compartilhado é reutilizado.
- `validacao/fase.cjs`: fluxo completo de jogo no Chromium, com relógio virtual e controles reais. Não injeta conclusão ou posições no jogo. O estado público `GuardiaoAreaAberta.estado()` serve para diagnóstico; não modifica a partida.

A sequência de resgate também reutiliza os 12 quadros de abrir a mochila, retirar e usar o kit de `../../assets/itens-remodelados/kai/02_kit_medico.png`, descritos em `assets/kai-resgate.js`. As artes originais continuam intactas. Os testes verificam que as seis poses de retirada da mangueira e as doze do kit aparecem durante as ações reais.

Canvas 2D nativo, sem dependências adicionais ou CDN. As artes carregam por caminhos relativos, inclusive no Pages em subpasta. O ciclo pausa quando a aba fica oculta. Movimento reduzido desliga o movimento decorativo do fogo, água, voo e brotos; movimentos e ações solicitados pelo jogador continuam funcionando. Efeitos sonoros sintetizados são opcionais, ativados pelo botão de nota musical. Não há backend, combate, controles de salto, gravidade ou câmera 3D nesta fase.

## Validar

Na raiz: `npm run dev`, depois `node jogo/area-aberta/validacao/fase.cjs`. A suíte também participa de `npm test` e `npm run test:build`. Testa missão real completa, caminho sem teleporte, água, equipamento, pausa, recuperação do progresso, passagem para o mapa, celular em 320/390/844 px, toque vertical, movimento reduzido, armazenamento bloqueado e falha de carregamento.
