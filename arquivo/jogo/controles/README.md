# Controles de celular

Joystick à esquerda, pulo com uma imagem de Kai saltando à direita e botão menor para usar/interagir. A área de treino está em **Sobre o jogo → Como jogar**.

- Joystick com zona morta, limite circular e intensidade proporcional.
- Captura de ponteiro e identificação independente dos dedos: é possível mover e pular ao mesmo tempo.
- Soltar, cancelar o toque, sair da janela ou ocultar a aba encerra o movimento.
- Alternativa acessível: foco no joystick e A/D ou setas; Espaço/seta para cima pula; Enter/Espaço no botão também pula.
- Controles com alvos de pelo menos 44 px; `touch-action` fica restrito aos controles, preservando a rolagem do restante da página.

`controles.js` expõe a classe `window.GuardiaoControles`. As instâncias automáticas ficam em `element.controlesGuardiao` nos elementos com `data-guardiao-controles`. O componente emite `guardiao:controle` com os tipos `mover` (`x`/`y` entre -1 e 1), `pular`, `soltar-pulo` e `usar`. O eixo vertical já é informado pelo joystick, mas o treino de plataforma usa somente o horizontal.

Uma futura cena Phaser pode escutar os eventos para movimentar o corpo físico e aplicar o salto. `reset()` neutraliza a entrada; `destroy()` também remove os ouvintes. O módulo funciona sem Phaser e sem build.

`treino.js` usa o mesmo componente para um pequeno teste de movimento, gravidade e pulo em um chão plano. Não é uma fase da campanha e não grava conclusão. A física desenha o movimento durante a caminhada e o salto; o repouso consulta os quadros em intervalos de 100 ms, sem uma atualização contínua a cada frame; esconder a aba de controles neutraliza os inputs. Movimento controlado pelo jogador continua disponível no modo de animações reduzidas.

A arte `../../assets/interface/kai-pulando.png` foi gerada a partir da prancha aprovada de Kai, mantendo cabelo, capa, roupa e mochila. O PNG original gerado foi preservado. O botão mantém esse desenho. O personagem no treino agora usa as sequências completas de caminhada, salto e repouso de `../personagens/kai/`, com 24 quadros finais.
