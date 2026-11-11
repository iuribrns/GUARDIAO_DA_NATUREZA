# Estrutura atual

| Local                                        | Responsabilidade                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `index.html`                                 | Entrada e redirecionamento para o jogo                                                     |
| `jogo/bosque-vivo/`                          | Controladores atuais, mapas compostos, crescimento, sprites de Kai, mochila e rotas         |
| `jogo/bosque-vivo/assets/`                   | Quadros WebP medidos, vegetação por partes, objetos e miniaturas dos trajes                  |
| `jogo/brisa/`                                | Artes dos comandos, folhas, transições, ajustes e pausa reutilizados                        |
| `jogo/viva/`                                 | Entrada atual, composição visual, símbolos, folhas, ajustes e encerramento ao vivo no mapa |
| `jogo/raizes/`                               | Busca de caminhos e personagens compartilhados; controladores anteriores preservados       |
| `jogo/viva/assets/`                          | Nova abertura, moldura, cenários de conversa, folhas e sprites WebP medidos                |
| `jogo/raizes/assets/`                        | Personagens compartilhados; pinturas antigas dos mapas preservadas fora da publicação     |
| `jogo/floresta-viva/index.html`              | Entrada da primeira fase                                                                   |
| `jogo/jornada/index.html?fase=2…5`           | Entradas das demais fases                                                                  |
| `jogo/cuidado-acessivel/`                    | Geometria, elenco e imagens otimizadas compartilhadas                                      |
| `jogo/sistemas/`, `jogo/vida-em-equilibrio/` | Progresso, controles, memória dos itens e conteúdo das fases                               |
| `jogo/encanto-natural/`                      | Uma trilha e os efeitos sonoros atuais                                                     |
| `tela-inicial/nova-versao/`                  | Compatibilidade dos endereços anteriores                                                   |
| `desenvolvimento/bosque-vivo/`               | Compilação atual, preparação das artes, testes das cinco fases, interface e medições        |
| `desenvolvimento/brisa/`                     | Testes dos comandos e histórico da revisão Brisa                                           |
| `desenvolvimento/viva/`                      | Manifesto, cópia estática e entrada da suíte atual                                           |
| `desenvolvimento/raizes/`                    | Histórico da revisão anterior                                                              |
| `jogo/viva/validacao/`                       | Regressão da interface e publicação em subpasta; campanha anterior preservada               |
| `desenvolvimento/laboratorio/`               | Laboratório de Phaser e GSAP, separado do jogo                                             |
| `docs/`                                      | Orientações do repositório                                                                 |

As demais pastas documentam versões anteriores. Seus controladores e suítes não devem ser misturados ao fluxo atual. A publicação copia apenas o manifesto atual. O laboratório e as fontes de arte ficam fora do site. Fontes de criação em `desenvolvimento/` ficam fora do site.

Para acrescentar recursos ao jogo, atualize o manifesto de publicação e confira a versão compilada. Imagens históricas retiradas podem ser recuperadas do commit listado em `desenvolvimento/raizes/retirados.json`.
