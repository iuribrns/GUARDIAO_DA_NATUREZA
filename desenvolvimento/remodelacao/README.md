# Kit de remodelação

As artes publicadas estão em `jogo/remodelacao/assets/`. O catálogo `atlas.js`
mantém as dimensões e âncoras do pacote recebido. Somente os WebP usados pelo
jogo foram incorporados; PNG, demonstração e prévias permanecem fora do site.

`recursos.js` integra ícones e objetos aos renderizadores atuais, preservando
coordenadas, categorias, hitboxes e estados das missões. A cidade mantém as quatro
categorias existentes: plástico, vidro, metal e papel. O painel solar é um objeto
da cena, separado do emblema de interação, com a rotação e o efeito de energia.

`carregamento.js` acompanha os grupos reais de dependências das cinco fases.
O percentual nunca chega a 100 antes de todas as promessas obrigatórias e da
inicialização da fase. Falhas preservam a tela e a ação de tentar novamente;
o fundo decorativo possui uma cor de reserva e não bloqueia a partida.

`interface.js` conserva os elementos, eventos e contadores dos diálogos. As
molduras dos títulos e estatísticas são divididas em trechos para preservar os
cantos. O cartão único de reflorestamento tem largura máxima de 440 px.

`verificar.cjs` testa a publicação em quatro resoluções, cinco fases, texto maior,
movimento reduzido, alinhamento dos diálogos e controles, conquistas, rede lenta,
falha obrigatória, nova tentativa e ausência do fundo. Usa a navegação real pelo
iframe que mantém a tela cheia, sem desabilitar esse fluxo.

Validação: `npm run build`, `npm run check:site`, `npm run audit:files` e
`npm run test:build`. Para executar apenas esta verificação com um preview ativo:
`GUARDIAO_TEST_URL=http://127.0.0.1:4189/jogo/viva/ node desenvolvimento/remodelacao/verificar.cjs`.
