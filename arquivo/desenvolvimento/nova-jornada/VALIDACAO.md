# Verificação da atualização

Executada em 04/11/2026 no build de produção servido pelo Vite Preview, com Chromium e Playwright. O progresso dos testes foi criado em contextos isolados.

- `npm run build`: aprovado.
- `npm run check:site`: aprovado; arquivos e integrações presentes nas sete entradas ativas, com caminhos relativos para GitHub Pages.
- `jogo/nova-jornada/validacao/interface.cjs`: aprovado em 844×390, 667×375, 740×320, 932×430 e 1024×768. Inclui as cinco fases, diálogos, pausa, mochila, seleção, configurações, Sobre o jogo, encerramento e a nova confirmação. Textos contidos e controles dentro da tela.
- `jogo/nova-jornada/validacao/controles.cjs`: aprovado. Entrada e saída reais de tela cheia com mouse e toque; raiz HTML; alternância única; atualização ao sair externamente; acesso pelos diálogos e pela pausa; funcionamento no modo teclado com joystick oculto.
- Ausência de API e recusa de solicitação: mensagens verificadas. Caminho WebKit verificado com uma implementação simulada; não representa um teste em um aparelho Safari físico.
- Cancelamento: dados preservados e animação do final retomada. Falha simulada ao gravar a nova geração: dados repostos, mensagem exibida e confirmação disponível para tentar novamente.
- Reinício pelos créditos: saves das cinco fases e do protótipo antigo removidos; mapa devastado, zero cristais, só primeira fase liberada; equipamentos e trajes zerados; Carlos apresenta novamente a missão. Preferências e uma chave de outro projeto permanecem intactas. Outra aba aberta é encaminhada ao início.
- Após o reinício, o epílogo volta a ficar bloqueado e a opção de nova jornada deixa de ser oferecida até uma nova conclusão.
- `git diff --check` e formatação dos novos arquivos JavaScript/CSS: aprovados.

As capturas podem ser reproduzidas com `node desenvolvimento/nova-jornada/capturar.cjs <pasta-de-saida>`, com o preview em execução. Não foi necessário alterar os objetivos, os sprites ou a geometria das fases para esta atualização; a campanha completa não foi jogada novamente nesta revisão.
