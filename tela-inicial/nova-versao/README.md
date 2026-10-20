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

Todo o código novo e os assets desta interface estão nesta pasta. No HTML anterior foi acrescentada somente a referência ao encaminhamento `nova-versao/entrada.js`. As versões anteriores, as fases e as demais pastas foram preservadas. A pasta beta foi removida pelo usuário no GitHub. O botão Jogar agora abre `aventura.html`, que apresenta as missões em desenvolvimento. Não há fase jogável integrada nesta versão; a jornada completa do colar ainda será implementada.

## Validação

Validado em Chromium em desktop 1440×900, celular 390×844 e celular deitado 667×375: entrada antiga, carregamento da nova arte/fonte, navegação entre as três telas, música e efeitos gerando áudio com contexto ativo, volumes, prévia, texto maior, restauração dos padrões, preferências persistidas, redução de movimento, abas por teclado, ausência de overflow horizontal e funcionamento com armazenamento bloqueado. Nenhum erro de JavaScript ou falha no carregamento dos arquivos das três novas telas.

## Prioridade para celular

A interface foi ajustada para toque: alvos de pelo menos 44×44 px, chaves maiores, barras de volume com puxadores de 28 px e área de arrasto com 44 px de altura. Em telas pequenas, os volumes ocupam a largura do painel, a leitura foi ampliada e o layout considera áreas seguras de telas com recortes. Rolagem e zoom do navegador continuam disponíveis.

A seção Como jogar apresenta primeiro os botões de toque da fase; o teclado fica em uma seção opcional recolhida. Não foram acrescentadas opções que simulam configurar controles ainda não implementados na fase.

Validado por simulação de celular com toque: ativação das chaves, arrasto do volume com eventos de toque, persistência e ausência de overflow entre 320 e 430 px, inclusive com Texto maior ativado. Testes em navegador emulado não substituem uma verificação em aparelhos físicos Android/iOS.

## Transições de tela

`transicoes.css` e `transicoes.js` adicionam transições ao abrir Configurações, Sobre o jogo e ao voltar ao início. Navegadores com View Transitions entre documentos usam uma troca suave dos painéis, mantendo o cenário. Nos demais navegadores e para outros destinos internos, há uma saída curta em CSS seguida da navegação normal; nas três telas também há uma entrada suave quando o recurso nativo não está disponível. As abas de Sobre o jogo têm uma transição própria, e os botões dão retorno visual ao pressionar.

Movimento reduzido desativa as animações de navegação. Links modificados (Ctrl/Cmd, nova aba), âncoras da própria página e destinos externos mantêm seu comportamento padrão. O botão Voltar do navegador restaura o estado da tela sem deixá-la bloqueada. Validado em Chromium com toque em celular, navegação nativa, alternativa sem recurso nativo, teclado, abas e navegação para a tela das missões.

O modelo do Claude enviado em `https://claude.ai/artifact/7eGwKq6gPJ36wEZ7U7RcDB` não estava acessível neste ambiente (erro 403 na requisição e falha de acesso pelo navegador). Estas transições foram feitas sobre o visual atual do jogo; não representam uma cópia conferida daquele modelo. A reprodução do modelo depende do envio do HTML ou de uma gravação acessível.

`aventura.html` foi acrescentada após sincronizar a exclusão da pasta beta no GitHub. O menu mantém a navegação sem apontar para arquivos removidos.
