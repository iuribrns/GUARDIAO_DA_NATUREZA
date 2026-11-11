# Fontes e empacotamento dos sprites

As fontes novas estão em `fontes/`: duas pranchas de caminhada de Kai, uma de cuidados/resgates, uma de Kai vestindo o colar e a ilustração do colar vazio. Foram criadas para esta revisão. As demais imagens vêm das pastas já existentes do jogo, sem alteração dos originais.

O defeito de recorte vinha de limites de grade que atravessavam asas, cabelo, botas e partes dos itens. `empacotar.py` mede as silhuetas conectadas e gera seleções vetoriais completas. O Inkscape compõe e exporta as novas células com margem; `cwebp` comprime a cor em qualidade 96 e preserva o canal alfa em qualidade 100. A medição usa Python, NumPy, SciPy e Pillow; a composição raster é exportada pelo Inkscape.

Os arquivos SVG gerados registram as seleções e referenciam as fontes relativas ao repositório. O cache local considera o SVG e o conteúdo dos arquivos de origem. Fontes com poses fundidas são rejeitadas; por isso a caminhada e o resgate do gatinho receberam fontes novas. A primeira linha da segunda prancha de caminhada é espelhada para corresponder à direção oeste. As âncoras do rosto de Flora e da caminhada evitam deslocamentos causados pela largura das asas ou pelo movimento dos braços.

`preparar-colar.py` mede os cinco encaixes da ilustração e exporta as máscaras, a geometria e o WebP do colar. O ponto do medalhão nas oito poses de Kai está descrito em `empacotar.py`.

## Reproduzir

Além do Node usado no jogo, esta etapa de autoria precisa de Inkscape, `cwebp` e das versões Python de `requirements.txt`. Os testes de navegação e sprites usam apenas Node e Chromium; não exigem os editores de arte.

```bash
python3 -m venv /tmp/guardiao-recortes-venv
/tmp/guardiao-recortes-venv/bin/pip install -r desenvolvimento/recortes/requirements.txt
GUARDIAO_TOOLS_DIR=/workspace/.tools/guardiao /tmp/guardiao-recortes-venv/bin/python desenvolvimento/recortes/empacotar.py
GUARDIAO_TOOLS_DIR=/workspace/.tools/guardiao /tmp/guardiao-recortes-venv/bin/python desenvolvimento/recortes/preparar-colar.py
```

`GUARDIAO_TOOLS_DIR` aponta para a pasta com `bin/inkscape` e `bin/cwebp`. Os resultados ficam nas novas pastas `jogo/sprites-integros/` e `jogo/colar-vivo/`. `relatorio.json` registra quadros, dimensões, margem e bytes das 24 pranchas. As fontes de autoria não são necessárias para carregar o jogo e ficam fora da cópia pública produzida pelo Vite.
