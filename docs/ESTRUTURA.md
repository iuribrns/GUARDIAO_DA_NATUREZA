# Estrutura atual

| Local                                        | Responsabilidade                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `index.html`                                 | Entrada e redirecionamento para o jogo                                                     |
| `jogo/brisa/`                                | Artes dos comandos, botânica, transições suaves, inventário e pausa atuais                 |
| `jogo/viva/`                                 | Entrada atual, composição visual, símbolos, folhas, ajustes e encerramento ao vivo no mapa |
| `jogo/raizes/`                               | Controladores compartilhados, atlas e animações reutilizados                               |
| `jogo/viva/assets/`                          | Nova abertura, moldura, cenários de conversa, folhas e sprites WebP medidos                |
| `jogo/raizes/assets/`                        | Mapas e personagens reutilizados; o MP4 antigo não é publicado                             |
| `jogo/floresta-viva/index.html`              | Entrada da primeira fase                                                                   |
| `jogo/jornada/index.html?fase=2…5`           | Entradas das demais fases                                                                  |
| `jogo/cuidado-acessivel/`                    | Geometria, elenco e imagens otimizadas compartilhadas                                      |
| `jogo/sistemas/`, `jogo/vida-em-equilibrio/` | Progresso, controles, memória dos itens e conteúdo das fases                               |
| `jogo/encanto-natural/`                      | Uma trilha e os efeitos sonoros atuais                                                     |
| `tela-inicial/nova-versao/`                  | Compatibilidade dos endereços anteriores                                                   |
| `desenvolvimento/brisa/`                     | Conversão das novas artes, teste das interações e medição de abertura                      |
| `desenvolvimento/viva/`                      | Compilação estática, manifesto, medições e relatório da revisão atual                      |
| `desenvolvimento/raizes/`                    | Histórico da revisão anterior                                                              |
| `jogo/viva/validacao/`                       | Interface e campanha real com teclado/toque; geometria e percursos                         |
| `desenvolvimento/laboratorio/`               | Laboratório de Phaser e GSAP, separado do jogo                                             |
| `docs/`                                      | Orientações do repositório                                                                 |

As demais pastas documentam versões anteriores. Seus controladores e suítes não devem ser misturados ao fluxo atual. A publicação copia apenas o manifesto atual. O laboratório e as fontes de arte ficam fora do site. Fontes de criação em `desenvolvimento/` ficam fora do site.

Para acrescentar recursos ao jogo, atualize o manifesto de publicação e confira a versão compilada. Imagens históricas retiradas podem ser recuperadas do commit listado em `desenvolvimento/raizes/retirados.json`.
