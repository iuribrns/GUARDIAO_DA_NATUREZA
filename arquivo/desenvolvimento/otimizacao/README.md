# Imagens leves

`otimizar-imagens.py` cria versões WebP com as mesmas dimensões e transparência, preservando todos os PNGs originais. `relatorio.json` lista tamanhos e caminhos. Referências estáticas dos menus são trocadas antes da primeira requisição; os carregadores de pranchas usam o manifesto compartilhado. Cada fase carrega somente suas pranchas.

Medição das requisições de imagens em Chromium, sem cache, antes/depois:

| Tela | Antes | Depois | Redução |
| --- | ---: | ---: | ---: |
| Inicial | 9,30 MB | 1,58 MB | 83,0% |
| Configurações | 5,33 MB | 1,03 MB | 80,7% |
| Primeira fase | 32,69 MB | 7,25 MB | 77,8% |
| Rio | 28,76 MB | 6,36 MB | 77,9% |
| Fauna | 26,15 MB | 5,93 MB | 77,3% |
| Reflorestamento | 26,44 MB | 5,94 MB | 77,5% |
| Cidade | 28,88 MB | 6,56 MB | 77,3% |

Valores em MB decimais, medidos no desenvolvimento local; tempos em rede móvel variam. O mapa carrega a pintura restaurada somente quando há uma região conquistada.
