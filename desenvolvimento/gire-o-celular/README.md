# Tela de orientação com o kit do jogador

A tela usa quatro componentes do `kit-gire-o-celular.zip`: floresta, moldura,
Flora com o celular e botão. A imagem completa serve apenas de referência.
Os textos continuam em HTML, incluindo o botão e seu estado de orientação.

Os quatro PNGs foram convertidos para WebP com qualidade 88, mantendo suas
dimensões originais e o canal alfa. Juntos passaram de 6.211.281 para 577.514
bytes (90,7% menores). O arquivo ZIP e a imagem de referência não são enviados
ao site. Moldura e Flora usam carregamento adiado; os fundos só são buscados
quando o aviso aparece. O quadro e as ilustrações preservam suas proporções.

`jogo/gire-o-celular/tela.css` adapta a composição ao espaço e às áreas seguras
do celular. A animação sutil de Flora respeita a redução de movimentos.
`jogo/revisao-paisagem/orientacao.js` mantém o bloqueio em retrato e a retomada
em paisagem, com tela cheia e rotação automática quando o navegador permite.
Caso contrário, orienta a pessoa a girar manualmente. O controlador genérico
de tela cheia não é mais ligado a esse botão, pois substituía o texto e
interrompia o pedido de rotação.

Para verificar a versão compilada servida localmente:

```sh
GUARDIAO_TEST_URL=http://127.0.0.1:4189/jogo/viva/ node desenvolvimento/gire-o-celular/verificar.cjs
```

A verificação cobre quatro tamanhos de celular, as cinco fases, proporções,
área de toque, APIs indisponíveis, retorno à paisagem sem perder progresso,
texto do botão, carregamento apenas quando necessário e redução de movimento.
