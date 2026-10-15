# Tela inicial — Guardiões da Natureza: Jornada de Kai

Menu inspirado na referência enviada pelo usuário, implementado em HTML, CSS e JavaScript, sem framework, instalação de dependências ou serviços externos.

## Abrir

Abra `tela-inicial/index.html` no navegador. Para desenvolvimento, execute na raiz de `GUARDIAO_DA_NATUREZA`:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

A tela fica no caminho `/tela-inicial/index.html` do servidor. Preserve a estrutura de pastas ao extrair o ZIP: as artes do menu ficam em `tela-inicial/assets/`; o botão Jogar aponta para `../beta`.

## Arquivos

- `index.html`: título, botões e janelas de informações e configurações.
- `style.css`: placas de madeira, botões verdes, folhas, iluminação e layouts responsivos.
- `script.js`: abertura das janelas, efeitos sonoros opcionais, configurações locais e tela cheia quando suportada.
- `assets/floresta-menu.png`: fundo ilustrado com Kai, Flora e cachoeira, gerado a partir da referência do usuário. É uma adaptação, não o arquivo original anexado.
- `assets/lilita-one.ttf`: fonte Lilita One, obtida do repositório oficial Google Fonts. Licença em `OFL-Lilita-One.txt`.

## Interações

JOGAR abre a fase existente em `../beta/index.html`. SOBRE O JOGO apresenta a missão e os controles. A engrenagem abre preferências de efeitos sonoros e animações e o botão de tela cheia, quando o navegador permite.

As preferências são guardadas no `localStorage`. Se o navegador bloquear o armazenamento, continuam funcionando na sessão. Sons são sintetizados com Web Audio após interação e estão desativados por padrão. Não há trilha musical. A preferência de movimento reduzido do sistema é respeitada. Escape e o botão × fecham as janelas; os diálogos nativos mantêm o foco e o devolvem ao botão de origem.

## Validação

Testado em Chromium com resolução de desktop 1672×941 e celular 390×844: carregamento da imagem/fonte, janelas, Escape, retorno de foco, persistência de preferências, armazenamento bloqueado e navegação para a fase beta. Sem erros de JavaScript ou falhas no carregamento dos arquivos da aplicação. Tela cheia depende das permissões do navegador.

A implementação está restrita à pasta `tela-inicial`; os arquivos das fases e as demais pastas existentes foram preservados.

## Trocar os sprites das fases

As artes e a fonte do menu ficam em `tela-inicial/assets/` e são independentes da pasta `assets/` da raiz. A tela inicial pode ser aberta mesmo se os assets das fases forem substituídos. A fase beta ainda faz referência aos assets antigos que o usuário excluiu; a integração deve ser atualizada quando os novos sprites e cenários forem fornecidos. Consulte `../assets/README.md` para organizar as novas artes.

O botão e a janela de mochila foram retirados a pedido do usuário. A nova organização do fundo foi testada com os assets antigos indisponíveis, em desktop e celular nas orientações vertical e horizontal.

## Foto original e folhas caindo

O fundo usa novamente a foto `assets/floresta-menu.png`. A animação fica em uma camada independente de folhas, implementada em `folhas.js` e CSS: não usa reprodução de vídeo. Kai, Flora e a câmera permanecem estáticos.

`assets/folhas-sprites.png` é uma versão preparada com transparência a partir da prancha de oito folhas enviada pelo usuário, organizada em quatro colunas e duas linhas. Os oito formatos são usados com tamanhos, giros e trajetórias diferentes. São 30 folhas em telas maiores e 18 em telas menores, distribuídas pela tela desde a abertura.

A opção Configurações → Animações desliga o efeito e salva a preferência. O movimento reduzido do sistema é respeitado; as animações pausam com a aba oculta. A camada não intercepta cliques. Os vídeos das versões anteriores foram preservados como arquivos, mas não são requisitados nem reproduzidos pela tela inicial.
