# Ilha interativa e painéis das seis fases

Entrada: `../nova-versao/aventura.html`, pelo botão **Jogar**.

## Interações

- As placas e o terreno das seis regiões abrem seus detalhes, inclusive nas fases bloqueadas. Consultar uma fase bloqueada não move Kai nem libera progresso.
- Destaque da região ao passar o ponteiro, focar com teclado ou selecionar; círculo de resposta ao toque.
- Correntes do rio, ondulações do mar, brilho do fogo, fumaça, brasas, pássaros e energia do portal são camadas SVG animadas por CSS. A interface não reproduz o GIF nem o vídeo do mapa.
- Ampliar/diminuir de 100% a 250%, arrastar com mouse ou dedo e restaurar o enquadramento. O arraste tem limite para manter o mapa cobrindo a janela e não dispara seleção ao soltar.
- Os painéis têm entrada/saída animada, três poses do aliado e duas de Kai; objetivos aparecem em sequência e a recompensa recebe um brilho leve.
- A prévia de recuperação mantém a dissolução entre as duas pinturas e acrescenta um pulso sobre a floresta. Enquadra a ilha antes de começar e não registra conclusão real.

Os painéis usam `<dialog>` nativo, texto selecionável, retorno de foco, Escape, botões de pelo menos 44 px e rolagem em telas pequenas. Fases bloqueadas permitem **consultar informações**; por isso o botão de consulta é habilitado e seu texto informa o bloqueio. A ação de iniciar fica desabilitada enquanto o gameplay não estiver implementado. Não foi criado um início de missão fictício.

As animações respeitam o movimento reduzido do sistema e do próprio jogo. O movimento ambiente pausa sob o painel e na aba oculta; o temporizador de poses só funciona com um painel aberto, visível e animações permitidas. Phaser e GSAP não são baixados por esta página; as camadas funcionam também em hospedagem estática, sem compilar.

## Arquivos e origem

- `conteudo-das-fases.json`: conteúdo original do pacote `paineis-das-fases.zip`, sem mudanças nos textos das missões.
- `conteudo.js`: o mesmo conteúdo em script clássico para funcionar sem depender de uma requisição JSON ou de um empacotador. Para atualizar, edite o JSON e regenere este arquivo com o comando abaixo. O teste compara as duas versões.
- `interacoes.js`: regiões, câmera, painéis, recortes de sprites e poses.
- `interativo.css`: composição responsiva e animações.
- `assets/`: as cinco folhas PNG do pacote, preservadas sem alterações. Personagens e itens são recortados em tempo de execução com SVG. Os limites dos quadros foram conferidos porque o espaçamento visual da folha não é uniforme. A folha de componentes também foi preservada como material para as próximas telas.
- `../selecao-fases/mapa.js`: continua responsável por bloqueios, progresso salvo, revisita e recuperação da primeira região. Sua API pública `GuardiaoMapa` foi mantida.

As seis imagens completas da pasta `telas/` do ZIP foram usadas como referência, e não como telas achatadas: os nomes, objetivos, imagens, botões e estados exibidos na interface são elementos separados. As durações são estimativas sugeridas, não limites nem medições do gameplay. A fase final usa o colar completo e recompensa a natureza restaurada, sem uma sexta peça.

Para regenerar o conteúdo, execute na raiz do repositório:

```sh
node --input-type=module <<'JS'
import {readFileSync, writeFileSync} from 'node:fs';
const folder = 'tela-inicial/mapa-interativo/';
const json = readFileSync(folder + 'conteudo-das-fases.json', 'utf8');
writeFileSync(folder + 'conteudo.js', '/* Conteúdo do pacote paineis-das-fases; versão clássica para hospedagem estática. */\nwindow.GuardiaoFases = Object.freeze((' + json + ').fases.map(fase => Object.freeze(fase)));\n');
JS
```

## Verificação

`npm test` inclui as verificações de progresso anteriores e `validacao/interacoes.cjs`: todos os dados das seis fases, reabrir painéis, consultar bloqueios, poses que avançam, correntes que se movem e pausam, zoom, arraste, movimento reduzido e operação por toque em 320/390/844 px. `npm run test:build` também executa os testes dos painéis sobre os arquivos de produção.
