# Estrutura do projeto

## Entradas e código atual

| Caminho                         | Função                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `index.html`                    | Abre diretamente o jogo.                                                                 |
| `jogo/viva/`                    | HTML e composição das telas do menu.                                                     |
| `jogo/trilhas-vivas/`           | Controladores, transições, folhas, mapa e renderização atuais.                           |
| `jogo/floresta-viva/index.html` | Entrada da primeira fase.                                                                |
| `jogo/jornada/index.html`       | Entrada das fases 2 a 5.                                                                 |
| Demais módulos em `jogo/`       | Arte, áudio, navegação, geometria, progresso e recursos compartilhados ainda utilizados. |
| `tela-inicial/`                 | Redirecionamentos antigos e pequenos módulos compartilhados.                             |
| `assets/`                       | Identidade e manifesto de recursos compartilhados.                                       |

## Desenvolvimento e materiais históricos

| Caminho                          | Função                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `desenvolvimento/organizacao/`   | Compilação, catálogo, plano de reorganização e auditoria.                          |
| `desenvolvimento/viva/`          | Manifesto gerado, cópia para `dist/` e executor da suíte.                          |
| `desenvolvimento/trilhas-vivas/` | Testes atuais, medições e exportador JavaScript.                                   |
| `arquivo/`                       | Materiais históricos preservados nos mesmos bytes, sem participação na compilação. |
| `entregas/`                      | Pacotes para baixar, fora do site.                                                 |
| `dist/`                          | Resultado de `npm run build`, ignorado pelo Git.                                   |

A reorganização preservou as URLs, os recursos e os dados de progresso do jogo. Nenhuma fase, personagem ou imagem em uso foi redesenhada. O [plano](../desenvolvimento/organizacao/plano.json) registra a origem e o destino dos arquivos movidos. `npm run audit:files` confere o histórico preservado e os recursos publicados. A opção `-- --comparar-originais` também comprova que os recursos do jogo ficaram idênticos durante esta reorganização; mudanças futuras intencionais podem usar a auditoria normal.

Mover o histórico para `arquivo/` deixa a área de trabalho mais clara. O tamanho total do Git continua incluindo as revisões antigas. O tamanho do site depende do manifesto de publicação, e o navegador baixa os recursos conforme o fluxo de uso.
