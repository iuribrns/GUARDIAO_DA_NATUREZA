# Nova interface — Horizonte de Kai e Flora

Três telas em HTML, CSS e JavaScript, inspiradas na descrição da conversa de referência: Kai de costas, Flora no ombro, floresta, rio e montanhas no horizonte. As imagens da outra conversa não estavam acessíveis; a ilustração é uma nova composição gerada a partir do design dos personagens existente no projeto.

## Abrir

Na raiz do repositório:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Caminho da interface: `/tela-inicial/nova-versao/index.html`. O endereço anterior `/tela-inicial/index.html` encaminha para esta versão. Também é possível abrir os HTMLs diretamente no navegador, mantendo as pastas juntas.

- `index.html`: início, título, Jogar, Configurações e Sobre o jogo.
- `configuracoes.html`: música ambiente sintetizada, volume da música, efeitos, volume e prévia dos efeitos, texto maior e redução de animações.
- `sobre.html`: história, como jogar e missão do colar, com abas acessíveis por clique, setas, Home e End.
- `style.css`: visual compartilhado, placas de madeira, painéis claros e layouts responsivos.
- `app.js`: navegação das abas, preferências, folhas e áudio.
- `entrada.js`: encaminhamento do menu anterior, sem apagar seu código ou suas pastas.

## Preferências e áudio

As preferências são salvas em `guardiao.horizonte.preferences.v1` no armazenamento local. Na primeira abertura, as escolhas de sons e movimento da interface anterior são aproveitadas quando disponíveis. As configurações funcionam por sessão se o navegador bloquear o armazenamento.

A música é uma melodia instrumental sintetizada localmente com Web Audio; não é uma gravação externa. O áudio começa somente após uma interação do usuário. A música pausa quando a aba fica oculta e retoma quando permitido. O botão de prévia dos efeitos funciona mesmo com os efeitos automáticos desligados. O volume zero mantém o áudio em silêncio. Sem suporte a Web Audio, os controles de áudio ficam indisponíveis e as demais preferências continuam funcionando.

A opção Texto maior afeta as três novas telas. A opção Reduzir animações desliga as folhas; a preferência de movimento reduzido do sistema sempre é respeitada. Kai e Flora permanecem estáticos.

## Artes e preservação

`assets/horizonte-kai-flora.png` é a nova ilustração. A fonte Lilita One e a prancha de folhas foram copiadas dos assets já existentes, com a licença da fonte mantida em `assets/OFL-Lilita-One.txt`. A mochila não foi reintroduzida como botão.

Todo o código novo e os assets desta interface estão nesta pasta. No HTML anterior foi acrescentada somente a referência ao encaminhamento `nova-versao/entrada.js`. As versões anteriores, as fases e as demais pastas foram preservadas. O botão Jogar mantém o destino da fase beta existente, que ainda depende da futura integração dos novos sprites/cenários; esta tarefa não modifica a jogabilidade nem implementa a jornada completa do colar.

## Validação

Validado em Chromium em desktop 1440×900, celular 390×844 e celular deitado 667×375: entrada antiga, carregamento da nova arte/fonte, navegação entre as três telas, música e efeitos gerando áudio com contexto ativo, volumes, prévia, texto maior, restauração dos padrões, preferências persistidas, redução de movimento, abas por teclado, ausência de overflow horizontal e funcionamento com armazenamento bloqueado. Nenhum erro de JavaScript ou falha no carregamento dos arquivos das três novas telas.
