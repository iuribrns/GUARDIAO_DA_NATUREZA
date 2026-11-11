# Água da mangueira

O efeito usa oito sprites de jato e oito de impacto, em uma prancha WebP com transparência e margem em cada célula. Há volume em azul/ciano, reflexos brancos e gotas acompanhando o fluxo. A imagem é compartilhada entre os quadros e carregada somente na fase da mangueira.

O ponto de saída acompanha o metal azul do bico nos 16 quadros de repouso e 32 de caminhada, considerando espelhamento e oscilação do personagem. O jato ganha pressão ao começar, aponta para o foco alcançável e mostra respingos somente quando existe um alvo. Soltar o botão, cancelar o toque ou pausar encerra o efeito. O consumo de água, o alcance e a velocidade para apagar o fogo mantêm as regras da fase.

Com animações reduzidas, a textura e o impacto ficam fixos e as gotas extras são removidas. Se a imagem falhar, uma forma de água desenhada no Canvas mantém o jogo funcionando. O desenho preserva o estado do contexto e usa uma quantidade fixa de partículas.

`atlas.js` contém os recortes, os pontos do fluxo e os engates de cada pose. `agua.js` desenha o efeito; `validacao/agua.cjs` confere os pixels das animações, margens, impacto, oito direções, uso real da mangueira, pausa, toque e falha da imagem. Com o servidor aberto, execute `node jogo/agua-viva/validacao/agua.cjs`.

A fonte ilustrada e o empacotador estão em `desenvolvimento/agua-viva/`. Os arquivos anteriores foram preservados.
