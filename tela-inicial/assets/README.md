# Artes independentes do menu

O fundo e a fonte da tela inicial ficam nesta pasta, separados dos sprites das fases em `/assets`.

- `floresta-menu.png`: ilustração gerada a partir da referência do usuário.
- `lilita-one.ttf`: Lilita One do repositório oficial Google Fonts.
- `OFL-Lilita-One.txt`: licença da fonte.

Os caminhos CSS são relativos a `tela-inicial/style.css`; o menu pode ser aberto por arquivo local ou em servidor HTTP.

## Cenário animado

- `floresta-animada.mp4`: versão H.264 sem áudio do segundo vídeo enviado pelo usuário (`gemini_generated_video_366363ea.mp4`).
- `floresta-poster.jpg`: frame extraído desse vídeo, usado como fundo estático e para manter os personagens parados.

O vídeo fica em loop atrás do menu HTML e pausa quando as animações são desligadas, o sistema solicita movimento reduzido ou a aba fica oculta.
