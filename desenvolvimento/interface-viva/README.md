# Interface viva — artes e menos botões

Revisão a partir de `50b90d0`, atendendo à crítica dos ícones de luva/mangueira, excesso de botões e painéis de fala/seleção com muita rolagem. O código fica em `jogo/interface-viva/`, e as fontes nesta pasta. As versões anteriores continuam preservadas.

## Resultado

- Na partida pelo celular, o canto inferior contém apenas equipamento e interação; a pausa fica no alto. Mochila vai para a pausa. Dica da Flora, efeitos sonoros, pulo, tela cheia e reinício ficam em Mais opções. O teclado continua com seus atalhos.
- O mapa mantém as seis placas da ilha (cinco fases e epílogo), sem a lista duplicada de seis botões no rodapé. As ações redundantes de ajustar um mapa já inteiro e abrir a explicação do jogo foram recolhidas. Progresso, mochila, voltar, Flora e tela cheia permanecem disponíveis.
- As introduções das cinco fases usam um painel horizontal: Kai e o aliado inteiros sobre a imagem inicial da região, texto do lado e um botão para continuar. O cenário da partida permanece visível ao fundo.
- A seleção da fase usa o mesmo arranjo. O painel evita repetir a fala e as instruções já apresentadas. A ação principal fica sempre acessível; em telas curtas, somente a coluna de informações pode rolar. Não existe prévia da região restaurada.
- A mochila exibe um botão apenas quando há um equipamento a vestir/retirar de fato. Luvas, kits e ferramentas usadas automaticamente viram informação de consulta. Equipamentos já ativos exibem Em uso. O fechamento duplicado no rodapé foi recolhido; o botão de fechar no cabeçalho continua disponível.

## Artes

28 ilustrações novas: 12 ferramentas e 16 símbolos. A luva mostra uma única mão de trabalho, com quatro dedos e um polegar. A mangueira tem um bico de metal e um enrolamento legível. Água, pata, mochila, rede, regador, sementes, equipamento de proteção, engrenagem, cadeado e demais itens seguem a mesma iluminação e paleta de verde, couro, madeira e metal quente.

As artes foram geradas com fundo transparente, conferidas visualmente e empacotadas por silhueta completa. `preparar.py` usa o empacotador existente para medir os limites; Inkscape compõe os SVGs, e WebP exporta a versão pública. As duas pranchas públicas somam cerca de **307 KiB**, com resolução adequada para os ícones no celular. Os PNGs e SVGs de criação permanecem nesta pasta e fora do build público.

`artes.js` mantém a API dos ícones: oferece markup no DOM e pintura em canvas, devolvendo a imagem legada esperada pelos controladores. A coleção usa as ferramentas novas e limita cada quadro do uniforme para evitar partes de poses vizinhas. `paineis.js` estende a interface existente e mantém os IDs e eventos dos controles transferidos para a pausa, fechando a pausa antes de ações que precisam da partida ativa.

## Verificação

- Build, referências relativas e presença das 28 artes no site.
- Interface nas cinco fases em 844×390, 667×375, 740×320, 932×430 e 1024×768, inclusive texto ampliado, mão esquerda e rotação durante a partida.
- Campanha inteira por teclado e toque, entrando pelo mapa, recebendo equipamentos, completando objetivos, resgates, perguntas, plantio, cidade, cristais e encerramento.
- Áudio, pausa e acionamento dos efeitos pelo novo acesso em Mais opções.

Os testes usam Chromium e toque emulado. As capturas são inspeções no navegador; não substituem uma sessão em um celular físico. A redução de botões altera a apresentação e o acesso às opções, sem mudar as regras das missões.

```sh
npm run build
npm run check:site
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/interface-viva/validacao/interface.cjs
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/interface-viva/validacao/campanha.cjs
```
