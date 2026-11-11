# Mata Ilustrada

Redesenho das cinco fases, sobre Bosque Vivo. A abertura, os personagens e seus trajes foram preservados.

- Materiais ilustrados de solo, cinza, areia, musgo, pedra, madeira e água; padrões espelhados evitam emendas. Trilhas contínuas têm curvas e junções sem círculos sobrepostos.
- Árvores maiores com raízes fixas, copas que crescem e vento suave. Bosques interiores dão profundidade às fases. O verde aparece progressivamente nos elementos existentes, sem sobrepor uma pintura saudável ao mapa.
- Cabana, abrigos e casas com proporção maior. Pontes têm tábuas, cordas e ordenação da borda dianteira junto aos personagens.
- Peças próprias por ambiente: bomba e suprimentos na floresta; barril, praia e píeres no rio; comedouros na fauna; bancada, vasos e canteiros no viveiro; bancos, postes e carrinho na cidade.
- A decoração sólida usa um cadastro compartilhado com a física. As raízes adicionais têm colisão nos pés. Objetivos, entradas e NPCs têm áreas reservadas. A câmera aproxima a ação para melhorar a leitura.
- Texturas e adereços em WebP. Chão, trilhas e vegetação baixa usam caches; a busca de rotas continua em Worker com alternativa cooperativa.

## Arquivos

Código e artes: `jogo/mata-ilustrada/`. `layout.js` compartilha posições; `configuracao.js` e `geometria-floresta.js` definem os colisores; `cenario.js` compõe as fases; `pintura.js` desenha os materiais. Os dois controladores anteriores receberam apenas a chamada da câmera nova.

`preparar.py` registra a preparação dos atlas a partir dos PNGs de criação; esses masters ficam fora do pacote público. A compilação usa apenas os WebP prontos. `converter-webp.py` gera cópias dos originais raster preservando alfa, dimensões e, quando houver, animação. A pasta `arquivo-webp` é um arquivo de entrega, não uma dependência do jogo.

## Verificação

```sh
npm ci
npm run build
npm run check:site
npm run test:build
```

A suíte inclui colisões executadas com movimento real, objetivos acessíveis, interfaces em paisagem, restauração, trajes, falha no fundo da abertura, rotas sem bloqueio da interface e campanha completa com teclado e toque emulado. O toque emulado não substitui teste em aparelho físico.

## Peso e conversão

O arquivo de entrega reúne 69 imagens raster convertidas: 143.157.721 → 27.727.386 bytes (80,63% a menos), mantendo os originais. Elas incluem documentos visuais de criação que não são carregados pelo jogo. O pacote público já usa WebP para suas imagens raster; os SVGs continuam vetoriais e o favicon ICO foi mantido por compatibilidade. A abertura medida sem cache solicitou 55 recursos, cerca de 1,22 MiB, sem vídeo. O site completo tem 277 arquivos e cerca de 33,92 MiB.
