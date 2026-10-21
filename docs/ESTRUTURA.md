# Organização do repositório

A entrada pública é `index.html`, na raiz. Ela abre o menu atual em `tela-inicial/nova-versao/index.html`, inclusive quando o site está na subpasta `GUARDIAO_DA_NATUREZA` do GitHub Pages.

| Pasta/arquivo | Responsabilidade |
|---|---|
| `index.html` | Abrir o jogo pelo link principal |
| `assets/` | Artes compartilhadas, personagens, itens e identidade da Flora |
| `assets/interface/` | Imagens dos controles; inclui Kai pulando |
| `jogo/` | Código reutilizável da jogabilidade e das futuras fases |
| `jogo/controles/` | Joystick, pulo, ação e área de treino |
| `tela-inicial/nova-versao/` | Menu atual, Configurações, Sobre e entrada do mapa |
| `tela-inicial/menu-vivo/` | Folhas, personagens interativos e aparência dos painéis |
| `tela-inicial/selecao-fases/` | Pinturas e progresso do mapa |
| `tela-inicial/mapa-interativo/` | Camadas do mapa e informações das seis fases |
| `tela-inicial/colar-remodelado/` | Arte do colar |
| `desenvolvimento/` | Ferramentas, laboratório, compilação e verificações |
| `docs/` | Organização e publicação do projeto |
| `.github/workflows/` | Publicação automática no Pages |
| `dist/` | Site gerado; ignorado pelo Git e enviado pelo workflow |

Os caminhos das versões e artes existentes foram preservados para manter links e referências funcionando. Código novo de controles e futuras fases deve ficar em `jogo/`, separado das telas do menu. As pastas antigas não foram apagadas ou trocadas de lugar.

`npm run build` reúne apenas arquivos públicos. `node_modules`, caches, configuração Git e os editores nativos não entram no site. O laboratório é compilado pelo Vite; os módulos clássicos do jogo continuam funcionando em servidor estático.
