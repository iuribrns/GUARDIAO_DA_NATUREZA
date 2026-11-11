# Brisa — folhas, comandos e coleção

Revisão de 11/11/2026 sobre o fluxo `jogo/viva/`. O código novo fica em `jogo/brisa/`; as entradas existentes incluem seus módulos.

- Transição de copa com sprites de folhas: 720 ms para cobrir e 900 ms para revelar. Toques repetidos durante a travessia não saltam de tela.
- 24 partículas em celular e 32 em computador, com folhas, flores e pétalas maiores. O modo gráfico Leve usa 14. Mouse, toque e foco nos botões principais soltam pequenas rajadas.
- Título com balanço suave de sete segundos. Menos movimento desliga o balanço, a chuva de folhas e as transições.
- Novo atlas de objetos ilustrados: engrenagem, mochila, mangueira, luva de cinco dedos, pausa, tela cheia, regador, rede, sementes, pá, coletes, kit, corda, chave e muda. Um atlas menor de 66 kB atende aos comandos frequentes.
- Mochila no mapa e nas fases, com 16 ferramentas, cinco trajes e os cristais. Equipamentos e trajes desconhecidos aparecem em silhueta, sem nomes ou descrições que revelem a surpresa. O inventário só prepara equipamentos já recebidos; abrir a coleção não entrega itens nem altera o progresso.
- O conteúdo da mochila rola dentro do painel, com quatro colunas em celulares maiores e três nos menores. A pausa usa duas colunas em paisagem e oferece continuar, ajustes e voltar ao mapa.
- Passeio tranquilo deixa o deslocamento de Kai 18% mais calmo, mantendo a mesma geometria e os mesmos controles. Pode ser desligado na aba Controles. A cadência de Flora também é mais calma. Os quadros de movimento já aprovados de Kai foram preservados.
- Placas das fases, botões de iniciar/voltar, comandos de toque e ajustes receberam acabamento de madeira e cores coerentes.

## Conferência

```sh
npm ci
npm run build
npm run check:site
npm run test:build
```

A suíte atual inclui os testes de `desenvolvimento/brisa/interface.cjs`: chuva de folhas, reação ao ponteiro/toque, tempo observado da transição, inventário no mapa e na fase, equipamentos reais, silhuetas, trajes, ritmo, tela cheia e pausa. Também verifica os limites dos sprites. Os testes da campanha continuam realizando as ações das cinco regiões com teclado e toque.

`preparar.py` documenta a medição/compactação das artes geradas nesta sessão. As fontes PNG ficam fora da publicação e não são necessárias para compilar: os WebP e atlas prontos estão no Git.

A abertura mede cerca de 1,20 MiB no servidor local, em uma visita sem cache; o pacote publicado ocupa cerca de 33,76 MiB. A coleção completa é buscada quando necessária. Esses números não representam um teste de FPS em aparelho físico. A conferência usa Chromium e toque emulado em paisagem.
