# Trajes, nado e uma única conclusão

O código novo fica em `jogo/correnteza/`. Não foram removidas artes anteriores.

- A mochila recorta uma única pose frontal de cada atlas de traje, com `clipPath` explícito. Cada traje mantém seu desbloqueio por fase e os futuros aparecem escurecidos.
- A preparação do mergulho dura 5,6 segundos. As quatro poses originais (retirar roupa da mochila, vestir, fechar e ajustar o visor) são desenhadas diretamente do banco carregado.
- O nado usa uma superfície pequena reutilizável para tingir e tornar o corpo parcialmente transparente, preservando a cabeça acima da água. Ondas diante do personagem reforçam a linha de água. O modo de redução de movimentos continua disponível.
- O encaixe do cristal acontece no próprio painel de conclusão. Ao terminar, o mesmo painel recebe as estatísticas, o progresso salvo e os botões; a tela antiga do colar permanece escondida.
- A tartaruga foi movida para uma faixa de areia afastada das plantas. Objetivos pendentes de partidas antigas usam a posição atual da fase.

`verificar.cjs` testa os cinco recortes, três trajes ainda bloqueados ao chegar ao rio, pixels visíveis nas quatro poses de vestir e a existência de um único painel de conquista em computador e celular. A campanha verifica o fluxo real das cinco fases, o salvamento e a passagem para a próxima região.
