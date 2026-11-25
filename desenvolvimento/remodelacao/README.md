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

A conversa segue a distribuição da prévia: faixa superior, cena com legenda à
esquerda e nome, fala, contador e Continuar à direita. O elemento `intro-name`
original fica visível e identifica o modal. Só a fala pode rolar quando o texto é
maior; o contador e a ação permanecem acessíveis. Os valores e as legendas das
estatísticas compartilham o alinhamento à esquerda ao lado do emblema.

A dica de carregamento mantém a região central livre dos personagens. Em erro,
o título informa a falha e a barra não continua aparentando progresso. A placa da
coleta seletiva acompanha a estação sem encobrir os rótulos das quatro lixeiras;
o teste da cidade compara os pixels de cada rótulo isolado e na cena completa.
Em telas paisagem de até 360 px de altura, o resumo compacto reserva espaço às
artes; a nota repetida continua disponível ao leitor de tela. A validação exige
uma área de pelo menos 100 px para a cena da comemoração, além de verificar que
as estatísticas e a ação de avançar cabem no painel.

`verificar.cjs` testa a publicação em quatro resoluções, cinco fases, texto maior,
movimento reduzido, alinhamento dos diálogos e controles, conquistas, rede lenta,
falha obrigatória, nova tentativa e ausência do fundo. Usa a navegação real pelo
iframe que mantém a tela cheia, sem desabilitar esse fluxo.

Validação: `npm run build`, `npm run check:site`, `npm run audit:files` e
`npm run test:build`. Para executar apenas esta verificação com um preview ativo:
`GUARDIAO_TEST_URL=http://127.0.0.1:4189/jogo/viva/ node desenvolvimento/remodelacao/verificar.cjs`.
