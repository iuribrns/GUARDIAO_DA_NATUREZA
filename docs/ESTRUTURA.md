# Estrutura atual

| Local | Responsabilidade |
| --- | --- |
| `index.html` | Entrada e redirecionamento para o jogo |
| `jogo/raizes/` | Menu, seleção, diário, ajustes, vídeo, personagens e controladores atuais |
| `jogo/raizes/assets/` | Pinturas WebP, sprites, atlas e vídeo MP4 |
| `jogo/floresta-viva/index.html` | Entrada da primeira fase |
| `jogo/jornada/index.html?fase=2…5` | Entradas das demais fases |
| `jogo/cuidado-acessivel/` | Geometria, elenco e imagens otimizadas compartilhadas |
| `jogo/sistemas/`, `jogo/vida-em-equilibrio/` | Progresso, controles, memória dos itens e conteúdo das fases |
| `jogo/encanto-natural/` | Uma trilha e os efeitos sonoros atuais |
| `tela-inicial/nova-versao/` | Compatibilidade dos endereços anteriores |
| `desenvolvimento/raizes/` | Publicação, medições, inventário da limpeza e documentação da revisão |
| `jogo/raizes/validacao/` | Interface e campanha real com teclado/toque; geometria e percursos |
| `desenvolvimento/laboratorio/` | Laboratório de Phaser e GSAP, separado do jogo |
| `docs/` | Orientações do repositório |

As demais pastas documentam versões anteriores. Seus controladores e suítes não devem ser misturados ao fluxo atual. A publicação copia apenas o manifesto atual, além do laboratório compilado pelo Vite. Fontes de criação em `desenvolvimento/` ficam fora do site.

Para acrescentar recursos ao jogo, atualize o manifesto de publicação e confira a versão compilada. Imagens históricas retiradas podem ser recuperadas do commit listado em `desenvolvimento/raizes/retirados.json`.
