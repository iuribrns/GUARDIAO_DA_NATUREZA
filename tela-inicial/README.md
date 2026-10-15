# Tela inicial — Guardiões da Natureza: Jornada de Kai

Menu inspirado na referência enviada pelo usuário, implementado em HTML, CSS e JavaScript, sem framework, instalação de dependências ou serviços externos.

## Abrir

Abra `tela-inicial/index.html` no navegador. Para desenvolvimento, execute na raiz de `GUARDIAO_DA_NATUREZA`:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

A tela fica no caminho `/tela-inicial/index.html` do servidor. Preserve a estrutura de pastas ao extrair o ZIP: os caminhos para `../assets` e `../beta` são relativos.

## Arquivos

- `index.html`: título, botões e janelas de informações, mochila e configurações.
- `style.css`: placas de madeira, botões verdes, folhas, iluminação e layouts responsivos.
- `script.js`: abertura das janelas, efeitos sonoros opcionais, configurações locais e tela cheia quando suportada.
- `../assets/tela-inicial/floresta-menu.png`: fundo ilustrado com Kai, Flora e cachoeira, gerado a partir da referência do usuário. É uma adaptação, não o arquivo original anexado.
- `../assets/tela-inicial/lilita-one.ttf`: fonte Lilita One, obtida do repositório oficial Google Fonts. Licença em `OFL-Lilita-One.txt`.

## Interações

JOGAR abre a fase existente em `../beta/index.html`. SOBRE O JOGO apresenta a missão e os controles. A mochila apresenta os equipamentos; não é um inventário persistente da fase. A engrenagem abre preferências de efeitos sonoros e animações e o botão de tela cheia, quando o navegador permite.

As preferências são guardadas no `localStorage`. Se o navegador bloquear o armazenamento, continuam funcionando na sessão. Sons são sintetizados com Web Audio após interação e estão desativados por padrão. Não há trilha musical. A preferência de movimento reduzido do sistema é respeitada. Escape e o botão × fecham as janelas; os diálogos nativos mantêm o foco e o devolvem ao botão de origem.

## Validação

Testado em Chromium com resolução de desktop 1672×941 e celular 390×844: carregamento da imagem/fonte, janelas, Escape, retorno de foco, mochila, persistência de preferências, armazenamento bloqueado e navegação para a fase beta. Sem erros de JavaScript ou falhas no carregamento dos arquivos da aplicação. Tela cheia depende das permissões do navegador.

A implementação está restrita a esta pasta nova e a `assets/tela-inicial`; os arquivos das fases e as demais pastas existentes foram preservados.
