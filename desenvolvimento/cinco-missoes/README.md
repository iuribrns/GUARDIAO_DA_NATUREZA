# Ferramentas e apresentações das cinco fases

As artes dos kits enviados foram convertidas para WebP sem alterar dimensões, personagens ou proporções. Os dezesseis ícones são compartilhados entre a mochila do mapa e as apresentações. As cinco cenas já contêm Kai, Flora no ombro e o aliado, evitando duplicar personagens sobre a imagem.

As molduras usam recortes do painel sem textos. Textos, objetivos, botões e desbloqueios continuam na interface real. A mochila mantém a coleção com rolagem vertical interna; não usa os desenhos de paginação ou barras impressas dos exemplos. A arte só é carregada ao consultar o painel correspondente.

Os 30 WebPs publicados somam 1.57 MiB, contra 15.96 MiB dos PNGs correspondentes. Os atlas duplicados e painéis de referência com texto não são publicados.

Após `npm run build`, com o preview na porta 4189:

```sh
node desenvolvimento/cinco-missoes/verificar.cjs
```

O teste verifica os dezesseis itens, o final da rolagem, bloqueios, preservação do progresso, artes e equipamentos das cinco fases, teclado/toque e encaixe em quatro resoluções. Também integra `npm test` e `npm run test:build`.
