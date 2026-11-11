# Código atual

| Arquivo                          | Responsabilidade                               |
| -------------------------------- | ---------------------------------------------- |
| `menu.js`                        | Telas inicial, configurações, Sobre e seleção. |
| `mapa.js`                        | Ilha de seleção e restauração.                 |
| `floresta.js`, `campanha.js`     | Controladores das cinco fases.                 |
| `folhas.js`, `transicoes.js`     | Folhas e passagem entre telas.                 |
| `renderizacao.js`, `natureza.js` | Camadas, água, vegetação e caches.             |
| `rotas.js`, `disposicao.js`      | Cliente das rotas e caminhos dos cenários.     |
| `assets/` e atlas                | Artes atuais.                                  |

As entradas HTML ficam em `../viva/`, `../floresta-viva/` e `../jornada/`. Os módulos compartilhados mantêm seus caminhos nas demais pastas de `jogo/`. Para executar, compilar ou testar, consulte o [guia de desenvolvimento](../../desenvolvimento/README.md).
