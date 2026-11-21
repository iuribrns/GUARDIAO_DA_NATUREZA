# Ferramentas e apresentações das cinco fases

As artes dos kits enviados foram convertidas para WebP sem alterar dimensões, personagens ou proporções. Os dezesseis ícones são compartilhados entre a mochila do mapa e as apresentações. As cinco cenas já contêm Kai, Flora no ombro e o aliado, evitando duplicar personagens sobre a imagem.

As molduras usam recortes do painel sem textos. Textos, objetivos, botões e desbloqueios continuam na interface real. A mochila mantém a coleção com rolagem vertical interna; não usa os desenhos de paginação ou barras impressas dos exemplos. A arte só é carregada ao consultar o painel correspondente.

Os recortes das abas incluem a borda completa e a sombra. Os ícones redondos têm máscara circular, e as ferramentas usam uma área quadrada centralizada, mantendo suas proporções. Os equipamentos compartilham a mesma linha nas apresentações; nas telas mais baixas, ficam ao lado da descrição para liberar espaço acima dos botões.

Os 30 WebPs publicados somam 1.57 MiB, contra 15.96 MiB dos PNGs correspondentes. Os atlas duplicados e painéis de referência com texto não são publicados.

Após `npm run build`, com o preview na porta 4189:

```sh
node desenvolvimento/cinco-missoes/verificar.cjs
```

O teste verifica os dezesseis itens, o final da rolagem, bloqueios, preservação do progresso, artes e equipamentos das cinco fases, teclado/toque, centralização das abas e dos ícones e encaixe em quatro resoluções. Também integra `npm test` e `npm run test:build`.
