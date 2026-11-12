# Arte original e acabamento ilustrado

Esta revisão recupera as pranchas limpas de Kai e dos cinco uniformes em
`jogo/reencontro/assets`. Os NPCs continuam usando as artes anteriores.
As pranchas redesenhadas de `brisa-suave/assets` permanecem no repositório,
mas não substituem mais esses personagens nem entram na publicação.

A Flora conserva as 16 poses de `encanto-natural`. Doze poses complementam
costas, diagonais de costas e perfil, com asas inteiras e pouso na direção de
Kai. `preparar.py` empacota essas poses com margens transparentes; não corta a
prancha em uma grade que possa incluir pedaços de outra pose.

Os novos cenários e molduras estão em `jogo/arte-viva/assets`, em WebP. O mapa
usa cinco regiões e a Árvore Guardiã ao centro. Nomes, numeração, botões e
indicador do jogador são elementos separados da pintura. O mar desfocado
preenche as margens quando a proporção da tela difere da ilustração, preservando
a ilha inteira. O mapa restaurado é revelado com o progresso do jogador.

Na abertura, Kai olha para a árvore com Flora no ombro, sem antecipar os cinco
cristais. Água, reflexos e luz são desenhados em uma camada de canvas; folhas,
paralaxe, título e botões se movem suavemente. A camada para fora da abertura,
com a página oculta ou quando a preferência é reduzir movimentos. Não há vídeo
para baixar na entrada.

O diário usa Kai e Flora se olhando; os ajustes usam Flora pousada de perfil.
O painel do colar tem título, colar, comemoração, contagem e cristais em áreas
próprias. A pose antiga segurando o colar completo aparece somente na quinta
conquista; nas demais, a sequência conserva apenas as pedras já recebidas.

## Verificação

```sh
npm run test:polimento
npm run test:build
npm run check:site
npm run audit:files
```

O teste visual específico está em `interface.cjs`: confere placas, limites dos
banners, ícone de tela cheia, recompensa e erros de recursos em 1280×720,
844×390 e 740×320. A campanha valida também resgates, rotas e conclusão com
teclado e toque. As capturas ficam em `test-results/arte-viva`.

`testar.mjs` aceita `--from=nome` para retomar uma sequência depois de corrigir
uma falha. A lista e a ordem dos casos ficam no próprio arquivo.
