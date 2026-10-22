# Floresta Viva — nova versão da primeira fase

> Versão atual: [revisão para celular](revisao/README.md), com 128 quadros remodelados, cenário ilustrado, colisões do reservatório/ponte, interface compacta e conclusão com fragmento vermelho. As artes e a documentação da primeira versão abaixo foram preservadas.

Fase em **2D isométrico em uma floresta de terreno contínuo**, criada a partir da composição da versão anterior. A cabana, o abrigo, o registro e a ponte ficam em um bosque com riacho, trilhas e clareiras; esta versão não usa montanhas, penhascos ou escadas. O mapa anterior e seus arquivos continuam em `../area-aberta/`.

## Jornada

1. Kai começa ao lado de Carlos. Uma conversa em quatro partes apresenta a floresta e os objetivos. É possível avançar por toque, clique, Enter ou esperar a leitura automática de cada fala. Movimento e missões ficam bloqueados durante a apresentação.
2. Carlos entrega a mangueira, o reservatório e o kit de resgate; os itens se deslocam das mãos dele para Kai. A fase só libera os objetivos depois dessa animação.
3. Kai abre o registro perto da ponte, apaga oito focos e usa o kit nos três animais. Os animais começam tristes e com curativos; recebem tratamento e seguem animados pelas trilhas até Carlos. O contador só avança quando chegam ao abrigo.
4. Cada incêndio apagado revela progressivamente a versão recuperada daquela clareira, com grama, flores e árvores jovens. A recuperação fica salva junto com a missão.
5. Depois que os oito focos e os três animais estão seguros, Kai precisa voltar para Carlos. A câmera aproxima a cena; ele entrega o fragmento do colar e Kai recebe, ergue o cristal, coloca-o no peito e comemora com Flora. Só então a fase é concluída e a próxima região é liberada.

O joystick anda nos dois eixos; mangueira mantida pressionada usa água; mão interage; mochila equipa a mangueira. No computador: WASD/setas, espaço, E e B. Tocar nas missões faz Flora indicar uma rota real pelas trilhas, interrompida ao mover o joystick. O registro reabastece o reservatório. O mapa é estático como arte-base, mas personagens, árvores adicionais, folhas, água, fogo, tratamento, caminhada dos animais e transformação das áreas são animados independentemente.

## Sprites e animações

Foram criados **108 quadros novos em 11 pranchas**, além das duas pinturas do mapa:

| Prancha | Quadros | Uso |
|---|---:|---|
| `kai-mangueira.png` | 16 | Oito direções com duas poses de repouso por direção |
| `kai-caminhada.png` | 16 | Caminhada com equipamento em oito direções |
| `kai-repouso.png` | 8 | Repouso, respiração e piscar de frente, costas e lados |
| `kai-recompensa.png` | 8 | Receber o fragmento, levantar, equipar no colar e comemorar |
| `flora.png` | 12 | Seis poses de voo, duas de pouso, duas de repouso e duas de comemoração |
| `capivara.png`, `cervo.png`, `passaro.png` | 24 | Ferimento/tristeza, tratamento, recuperação e quatro poses de caminhada/voo por animal |
| `carlos.png` | 8 | Repouso, conversa, equipamentos, fragmento, aplausos e orientação |
| `natureza.png` | 8 | Árvores, broto, samambaia, folhas, flores e copa |
| `itens.png` | 8 | Mangueira, kit, fragmento, mochila e quatro quadros de jato |

As animações anteriores de retirar o equipamento da mochila e usar o kit são reutilizadas por referência, sem modificar os arquivos originais. O fogo também reutiliza a prancha animada da versão anterior. Para o ângulo sudoeste, o desenho é espelhado quando necessário para manter a direção correta.

Flora tem os estados `voando`, `aproximando`, `pousando`, `ombro`, `decolando` e `comemorando`. Após 2,5 segundos sem andar ou agir, ela se aproxima e pousa no ombro de Kai; volta a voar ao retomar uma ação. Kai respira e pisca, inclusive ao guardar temporariamente a mangueira durante o repouso. Os pés ficam ancorados pelo atlas para evitar que o corpo salte entre poses.

`assets/quadros/` contém os **108 recortes SVG individuais**, que referenciam as pranchas PNG por caminho relativo. Mantenha a estrutura ao extrair. `atlas.json` e `atlas.js` contêm os limites, pivôs e dimensões; o script `../../desenvolvimento/sprites-floresta/gerar-atlas.py` os regenera analisando a transparência sem alterar os pixels dos PNGs. As linhas e colunas reais foram conferidas, pois as pranchas não têm espaçamento perfeitamente uniforme.

## Arquitetura, conforto e dados

- `mundo.js`: corredores de colisão, clareiras, riacho, ponte, objetivos, árvores e rotas por menor distância. A aproximação aos nós considera a visibilidade sobre o solo caminhável.
- `sprites.js`: renderizador do atlas, itens, poses direcionais e jato orientado até o foco.
- `ambiente.js`: folhas, árvores, correnteza, fogo, brotos, recuperação das áreas e partículas da comemoração.
- `fase.js`: abertura, inventário, estados da missão, joystick multitouch, tratamento, retorno dos animais, Flora, recompensa e persistência.
- `fase.css`: reutiliza as medidas dos controles anteriores e aplica os novos balões de natureza. Fala e dica desaparecem automaticamente; a conversa inicial avança após 14 segundos por página ou antes por ação do jogador. Pausa e mochila interrompem a simulação.

A preferência de movimento reduzido desliga os efeitos decorativos e mantém as ações solicitadas pelo jogador. Ao esconder a aba, o ciclo é cancelado e os controles são neutralizados. Os efeitos sonoros opcionais usam o volume das configurações. A tela indica o andamento do carregamento das artes.

O progresso usa `guardiao.floresta-viva.v2`, separado do protótipo antigo. Animais em retorno são retomados da posição salva. A premiação registra `guardiao.colar.fragmentos.v1` e atualiza `guardiao.mapa.progresso.v1`. Uma partida antiga da outra versão não pula o encontro com Carlos nesta floresta. Não há serviço remoto de salvamento: os dados pertencem ao navegador. Sem acesso ao armazenamento, a partida continua e informa que não foi salva.

## Validação

`node jogo/floresta-viva/validacao/floresta.cjs` roda o fluxo inteiro sobre o Vite. A suíte também participa de `npm test` e `npm run test:build`. Usa entradas reais e relógio virtual, sem injetar teleporte ou conclusão. Verifica conversa obrigatória, entrega, repouso/pouso/decolagem, expiração de balões, água, incêndios, tratamento, retorno dos animais, volta para Carlos, oito poses da premiação, quatro quadros do jato, persistência, toque em 320/390/844 px, cancelamento de multitouch, movimento reduzido, armazenamento bloqueado, erro de arte e caminhos do Pages.
