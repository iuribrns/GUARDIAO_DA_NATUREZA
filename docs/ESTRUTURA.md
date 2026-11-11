# Estrutura atual

| Local                                        | Responsabilidade                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `index.html`                                 | Entrada e redirecionamento para o jogo                                                     |
| `jogo/sereno/`                               | Controladores atuais, rotas em segundo plano, equipamentos, colar, folhas e acabamento      |
| `jogo/sereno/assets/`                        | Nova abertura, oceano e 72 quadros de personagens em WebP com recortes medidos               |
| `jogo/brisa/`                                | Artes dos comandos, transições, ajustes e painel de pausa reutilizados                     |
| `jogo/viva/`                                 | Entrada atual, composição visual, símbolos, folhas, ajustes e encerramento ao vivo no mapa |
| `jogo/raizes/`                               | Navegação, atlas e animações compartilhados; controladores anteriores preservados           |
| `jogo/viva/assets/`                          | Nova abertura, moldura, cenários de conversa, folhas e sprites WebP medidos                |
| `jogo/raizes/assets/`                        | Mapas e personagens reutilizados; o MP4 antigo não é publicado                             |
| `jogo/floresta-viva/index.html`              | Entrada da primeira fase                                                                   |
| `jogo/jornada/index.html?fase=2…5`           | Entradas das demais fases                                                                  |
| `jogo/cuidado-acessivel/`                    | Geometria, elenco e imagens otimizadas compartilhadas                                      |
| `jogo/sistemas/`, `jogo/vida-em-equilibrio/` | Progresso, controles, memória dos itens e conteúdo das fases                               |
| `jogo/encanto-natural/`                      | Uma trilha e os efeitos sonoros atuais                                                     |
| `tela-inicial/nova-versao/`                  | Compatibilidade dos endereços anteriores                                                   |
| `desenvolvimento/sereno/`                    | Testes atuais de campanha, resgates, rotas, interface e colar; medições e preparação de arte |
| `desenvolvimento/brisa/`                     | Histórico das artes e interações da revisão Brisa                                          |
| `desenvolvimento/viva/`                      | Compilação estática, manifesto e entrada da suíte atual                                    |
| `desenvolvimento/raizes/`                    | Histórico da revisão anterior                                                              |
| `jogo/viva/validacao/`                       | Regressão da interface e publicação em subpasta; campanha anterior preservada               |
| `desenvolvimento/laboratorio/`               | Laboratório de Phaser e GSAP, separado do jogo                                             |
| `docs/`                                      | Orientações do repositório                                                                 |

As demais pastas documentam versões anteriores. Seus controladores e suítes não devem ser misturados ao fluxo atual. A publicação copia apenas o manifesto atual. O laboratório e as fontes de arte ficam fora do site. Fontes de criação em `desenvolvimento/` ficam fora do site.

Para acrescentar recursos ao jogo, atualize o manifesto de publicação e confira a versão compilada. Imagens históricas retiradas podem ser recuperadas do commit listado em `desenvolvimento/raizes/retirados.json`.
