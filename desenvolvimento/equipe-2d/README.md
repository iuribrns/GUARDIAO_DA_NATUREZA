# Estudantes em 2D no diário

A correção preserva as artes anteriores e o retrato do Professor Peterson Lobato. As novas artes ficam em uma pasta própria.

- Iuri Barroso Nascimento: pele morena, cabelo preto crespo/cacheado e cavanhaque.
- Hicham Mohamed El Attar: cabelo preto cacheado mais volumoso, conforme confirmação do usuário.
- Os dois estudantes têm modelos 2D de corpo inteiro: repouso, piscada, apresentação e cumprimento. Os personagens são desenhados em canvas; as imagens de Rowlet e Decidueye ficam ao lado, como referências visuais.
- O professor mantém os mesmos quatro quadros da ilustração anterior.

No computador, as duas cenas ficam lado a lado. No celular, a galeria rola horizontalmente com toque ou botões; os bonecos não viram uma lista de retratos empilhados. A largura do diário se ajusta ao conteúdo de Sobre Nós e volta ao layout anterior ao mudar de aba.

`fontes/estudantes.png` é a prancha original gerada a partir da referência ilustrada anterior e das correções do usuário. Execute `python3 desenvolvimento/equipe-2d/preparar.py` para medir as silhuetas, alinhar pivôs e exportar a prancha WebP com Inkscape e libwebp. Nenhuma imagem ou pasta anterior é apagada.

Os Pokémon continuam sendo artes oficiais de referência do acervo PokeAPI, com a atribuição já presente em Sobre Nós. Estar ao lado de um estudante não atribui a ele a inspiração pessoal de um personagem: Flora continua tendo Rowlet como referência do projeto.

Validação específica: `node tela-inicial/equipe-2d/validacao/equipe.cjs`, com Vite iniciado (`npm run dev`). A suíte verifica arte completa, mudanças reais de pixels nas animações, toque/teclado, gesto e fala temporária, movimento reduzido, galerias horizontais e referências visíveis ao lado dos estudantes em computador e celular.

Verificado nesta correção: suíte específica em desenvolvimento e no build de produção, regressão de Renascimento e do menu, build e conferência dos caminhos públicos. As figuras completas e todas as poses têm margem transparente. Os testes também verificam as interações com toque real em emulação de celular e o retorno às outras abas do diário.
