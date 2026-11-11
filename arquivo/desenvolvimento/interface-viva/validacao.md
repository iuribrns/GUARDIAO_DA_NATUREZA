# Validação da interface viva — 04/11/2026

Base: `50b90d0`. Verificação em Chromium, com teclado e toque emulado.

| Grupo | Resultado |
| --- | --- |
| `npm run build` | Passou. |
| `npm run check:site` | Passou: caminhos, 28 quadros, margens completas, pranchas e novas entradas presentes. |
| `jogo/interface-viva/validacao/interface.cjs` | Passou nas cinco fases e nos seis destinos em 844×390, 667×375, 740×320, 932×430 e 1024×768. |
| `jogo/interface-viva/validacao/campanha.cjs` | Passou do menu ao encerramento, por teclado e toque. Os objetivos foram conquistados pelas ações do jogo. |
| `jogo/sons-da-natureza/validacao/audio.cjs` | Passou, incluindo som acessado em Mais opções, volumes, gesto, mangueira, cancelamento, pausa e falhas de áudio. |
| `jogo/colar-vivo/validacao/colar.cjs` | Passou nas cinco cores, oito poses, encaixe, movimento reduzido, toque e persistência. |
| `tela-inicial/equipe-retratos/validacao/professor.cjs` | Passou: apenas o Professor Peterson, retrato preservado, abas, quatro telas deitadas, toque, rotação e alternativa sem GSAP. |
| `tela-inicial/menu-vivo/validacao/menu.cjs` | Passou: menu, folhas, personagens, toque, teclado, preferências e alternativa sem GSAP. |
| Capturas | Cinco introduções/partidas, seis seleções, pausa, mochila, uniformes e galeria das 28 artes, sem erros de JavaScript ou arquivos ausentes. |

A interface confere dois botões de ação na partida e apenas a pausa no alto. Mochila e demais opções ficam no menu; o teste entra na mochila por toque usando esse novo caminho. A campanha testa a retirada real da mangueira e todos os cuidados, perguntas e recompensas. Os itens passivos já não exibem ações redundantes de equipar.

As capturas usam progresso preparado para inspecionar todas as telas. O percurso completo usa uma sessão nova, sem desbloqueios artificiais. O teste também confere personagens dentro da própria coluna da cena, incluindo Flora no painel do epílogo, para evitar novo recorte na borda.

O resultado é de navegador com toque emulado; não houve sessão num Android/iPhone físico. Não foi executada novamente toda a suíte dos protótipos antigos: foram executados os grupos acima, adequados aos controles, apresentação e recursos alterados.
