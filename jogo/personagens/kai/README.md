# Renderizador das animações de Kai

`animador.js` expõe `window.GuardiaoKaiAnimado`, um renderizador de sprites em Canvas 2D, independente de Phaser e sem nova dependência. As pranchas e os 24 quadros finais ficam em `../../../assets/personagens/kai/animacoes/`.

Carregue o `atlas.js` das artes antes deste script. Instancie o renderizador com o elemento de Kai, aguarde `.ready` e chame `.update()` a partir da física. A área de treino em `../../controles/treino.js` mostra a integração completa.

Entradas:

- `state`: `parado`, `andando`, `preparando`, `no-ar` ou `aterrissando`.
- `distance`: distância horizontal percorrida em pixels; um ciclo completo corresponde a 96 px, independentemente do número de frames do navegador.
- `velocity`: velocidade vertical, positiva na subida.
- `height`: altura acima do chão; `airTime`: tempo no ar em segundos.
- `landing`: tempo desde o contato com o chão; `idleTime`: tempo de repouso.
- `reduced`: mantém o repouso sem animação automática. Movimentos solicitados pelo jogador continuam renderizados.

O quadro é redesenhado somente quando a pose muda. As imagens são decodificadas uma vez e compartilhadas; o canvas usa resolução de até 2× para telas de celular. Os dados incluem limites reais, pivô dos pés e uma escala comum para evitar cortes e tremores. `animacao.css` aplica o tamanho do personagem e mantém o fundo do treino enquadrado sem os personagens já pintados na paisagem.

O treino move a posição a cada frame, acelera a caminhada progressivamente e para imediatamente ao soltar o joystick. O salto tem preparação curta, subida/ápice/queda selecionados pela física e duas poses de aterrissagem. O desenho de repouso usa esperas de 100 ms quando o personagem está parado; não há ciclo contínuo oculto. Esconder o painel ou a página cancela o agendamento e neutraliza a entrada.

Se as imagens falharem, a arte estática anterior permanece como alternativa e os controles continuam funcionando. A área não registra progresso da campanha nem substitui as futuras fases jogáveis.
