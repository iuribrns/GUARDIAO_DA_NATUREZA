# Sobre Nós — Professor Peterson

A seção apresenta apenas o perfil do Professor Peterson Lobato. Os cartões e avatares de Iuri e Hicham foram retirados dessa seção. A autoria nos créditos do jogo permanece preservada. Não há referências a Pokémon na página nem nos créditos ativos.

O retrato aprovado do professor continua sendo desenhado pela mesma prancha, com a mesma expressão e piscada. A apresentação usa um cartão verde, moldura de madeira, textura discreta e textos com contraste. Flora acompanha o texto sobre a mascote do próprio jogo.

`professor.js` carrega somente o retrato compartilhado e Flora. A animação respeita a aba visível, orientação da tela, página em segundo plano e movimento reduzido. O GSAP já instalado faz a entrada do cartão e o balanço das folhas com mouse ou toque. Sem GSAP, o conteúdo e a animação dos personagens continuam funcionando.

`professor.css` aplica o visual e o arranjo em paisagem. `retratos.css` mantém o acabamento da área da Flora e os estilos anteriores arquivados. Os arquivos e sprites antigos da equipe continuam nas pastas anteriores, sem serem carregados nessa página.

Ferramentas disponíveis no ambiente: GSAP 3.15.0, LibreSprite 1.3, Tiled 1.12.2, Inkscape e Krita. Esta alteração usa GSAP e CSS; não acrescenta dependências.

Verificação: `validacao/professor.cjs`, build e `npm run check:site`. O teste percorre abas, piscada, movimento reduzido, mouse/toque, paisagem, rotação e funcionamento sem GSAP.
