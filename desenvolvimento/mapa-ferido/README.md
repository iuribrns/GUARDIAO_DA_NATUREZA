# Mapa antes da recuperação

As novas artes ficam em `jogo/mapa-ferido/assets`, em WebP. A ilha inicial tem
árvores secas e queimadas, solo rachado, instalações danificadas, lixo no rio e
abrigos abandonados. A costa, as trilhas e as cinco regiões mantêm suas posições;
a imagem saudável e a restauração por progresso continuam funcionando.

As placas têm três estados derivados do progresso já salvo:

- `distante`: fase ainda não liberada; madeira rachada, folhas secas e fundo escuro.
- `atual`: fase liberada, com madeira e folhas verdes.
- `recuperada`: fase concluída, com a marca de conclusão.

Abrir as informações de uma fase bloqueada não altera esse estado. Reiniciar a
jornada também devolve a madeira danificada às fases futuras.

Os nomes usam a fonte Lilita, já presente no jogo. As linhas ficam centralizadas
no campo interno da placa. Em telas de celular na horizontal, as placas medem
de 138 a 160 pixels de largura por 58 de altura, mantendo o alvo de toque.

O marcador usa um retrato próprio de Kai. Os sprites do personagem dentro das
fases permanecem preservados. O retrato só é carregado ao abrir o mapa.

`verificar.cjs` confere cinco resoluções, centralização das linhas, progresso,
prévia bloqueada, reinício, retrato e ausência de erros de recursos.

```sh
npm run build
GUARDIAO_TEST_URL=http://127.0.0.1:4189/jogo/viva/ node desenvolvimento/mapa-ferido/verificar.cjs
```

As capturas ficam em `test-results/mapa-ferido`. Use um servidor de prévia para
`dist` na porta indicada antes de executar o teste.
