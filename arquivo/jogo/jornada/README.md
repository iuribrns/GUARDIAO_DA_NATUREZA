# Jornada de Kai: fases 2 a 5

A primeira fase continua em `../floresta-viva`. Esta pasta acrescenta quatro aventuras de exploração em uma floresta ilustrada, sem substituir pastas anteriores. A sexta fase permanece em preparação.

| Fase | Aliado | Ações | Fragmento |
| --- | --- | --- | --- |
| 2 · Rio Poluído | Antônio | Nadar, recolher oito resíduos, soltar peixes e cuidar da tartaruga | Azul |
| 3 · Resgate da Fauna | Marina | Abrir dois abrigos com desafios visuais, descer com o gatinho e cuidar da ave | Amarelo |
| 4 · Reflorestamento | Rafael | Semear seis canteiros, regar, preparar dois ninhos e reabastecer na fonte | Verde |
| 5 · Cidade Sustentável | Luciana | Recolher/separar seis resíduos, ajustar dois painéis solares e cultivar dois jardins | Violeta |

Cada fase começa perto do aliado, com duas falas e a entrega dos equipamentos. As ações têm animação própria; os animais resgatados seguem um caminho até um local seguro. As recompensas só são entregues depois de cumprir os objetivos e voltar ao aliado. A restauração da ilha aparece após a conquista, sem botão de prévia.

## Arquivos

- `fases.js`: posições, obstáculos, água, equipamentos, tarefas, falas e cores.
- `navegacao.js`: colisão nos pés, grade com diagonais sem cortar quinas, desvio de obstáculos e caminhos para Kai/animais. Árvores plantadas atualizam a grade.
- `jornada.js`: estados da missão, teclado/toque, coleta, cuidados, puzzles sem cronômetro, plantio, reciclagem, salvamento e conclusão.
- `sprites.js`: pranchas com recortes alfa medidos, carregadas por fase.
- `assets/`: quatro mapas, quatro versões restauradas, ícones, objetos, animais e animações novas de Kai. Os PNGs originais permanecem aqui; a versão publicada usa WebP por meio do manifesto.
- `gerar-atlas.py`: mede as pranchas sem editar imagens e gera `atlas.js`, `atlas-floresta.js` e `assets/atlas.json` (198 quadros, incluindo os 18 gestos dos aliados preservados).
- `validacao/`: navegação real por teclado/toque, missões até a recompensa, salvamento e testes em celular.

## Controles

WASD/setas movem, E interage, Espaço usa o equipamento, B abre a mochila e Esc pausa. No celular há joystick de oito direções, equipamento, mão e mochila. Na pausa e em Configurações é possível escolher **detectar dispositivo / celular / computador**. A preferência é salva; o modo computador oculta os controles de toque sem desativar o teclado.

Flora continua voando durante toda a fase do rio. Em terra, pode pousar no ombro quando Kai descansa. Na floresta da primeira fase, a mangueira permanece guardada até terminar a animação de puxá-la da mochila.

## Validação e edição

```sh
npm ci
npm run dev
npm test
npm run build
npm run check:site
npm run test:build
npm run format:campaign
```

Para recriar os metadados e as versões leves das imagens, com Pillow disponível:

```sh
python jogo/jornada/gerar-atlas.py
python desenvolvimento/otimizacao/otimizar-imagens.py
```

O progresso usa `guardiao.jornada.fase.{2..5}.v1` e o mesmo registro da ilha `guardiao.mapa.progresso.v1`. O salvamento da primeira fase e as preferências anteriores são preservados. APIs públicas de inspeção são somente leitura; não há API de prévia de restauração no mapa atual.
