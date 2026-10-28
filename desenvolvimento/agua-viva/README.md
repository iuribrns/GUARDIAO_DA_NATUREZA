# Fonte do efeito de água

`fontes/agua-original.png` é uma nova ilustração gerada para o jogo: oito estados de fluxo e oito de respingo. `fontes/agua-quadros.svg` contém as seleções para exportação pelo Inkscape.

O empacotador mede a transparência, mantém a água e as gotas com suas bordas suaves e remove o ruído quase transparente distante das silhuetas. Cada quadro recebe margem própria. A arte é exportada pelo Inkscape e comprimida com `cwebp`, qualidade de cor 94 e alfa 100. Nenhuma imagem anterior é alterada.

Para reproduzir, use os executáveis já instalados em `/workspace/.tools/guardiao/bin` e as bibliotecas de `desenvolvimento/recortes/requirements.txt`:

```sh
python3 desenvolvimento/agua-viva/empacotar.py
```

O script também mede a área azul do bico nas poses atuais de Kai. Se essas poses forem substituídas, execute novamente o empacotador para atualizar os engates. Os resultados são `jogo/agua-viva/assets/agua.webp`, `assets/atlas.json` e `atlas.js`.
