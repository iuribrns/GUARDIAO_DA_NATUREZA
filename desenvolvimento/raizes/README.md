# Revisão Raízes — 10/11/2026

A capa usa uma pintura de floresta, uma placa de título própria e atores em camadas separadas. Foram criados quadros de Kai caminhando e segurando a mangueira em oito direções, poses de cuidado/celebração, Flora voando/pousada/piscando e cinco aliados em escuta/conversa. Os pivôs e limites do atlas são medidos pelo alfa; cada quadro é recortado individualmente no Canvas.

A seleção contém cinco regiões e a Árvore Guardiã central. A restauração de cada região depende do progresso. Não há sexta missão, prévia do resultado nem coração como recompensa final. O filme MP4 de 33 segundos só é solicitado após as cinco conquistas; há animação Canvas de reserva e uma imagem final para movimento reduzido.

Os painéis têm duas colunas, conteúdo contido e ações curtas. Configurações e inventário funcionam como diálogos sobre a fase. O reset limpa somente a campanha, preserva preferências e usa uma geração para invalidar partidas antigas em outra aba ou no histórico.

## Colisão e desempenho

A busca de caminho usa uma fila de prioridade, cache das conexões e a mesma verificação de segmentos da colisão real. O cache é invalidado quando os obstáculos dinâmicos mudam. O degrau/passagem diante da cabana não é tratado como parede. Animais seguros deixam de bloquear a rota de Kai, e rotas fracassadas não são recalculadas a cada quadro. Animais precisam chegar ao abrigo por uma rota válida, sem salto até o destino.

A simulação continua em cada quadro disponível, com desenho limitado a aproximadamente 30 quadros/s e 10 durante diálogos de pausa. O limite de pixels é 1,5× e a HUD da floresta evita reescritas a cada quadro. Isso reduz o trabalho de desenho; a taxa efetiva depende do aparelho.

`desempenho.json` compara buscas de aproximação no mesmo ambiente Node: quatro passagens pelos objetivos das fases 2–5, 148 rotas encontradas em cada implementação. O conjunto caiu de cerca de 6,33 s para 1,60 s nesta medição. As fases 3/4 variaram pouco; a maior diferença está na cidade e no rio. Não é uma medição de FPS em celular físico.

`carregamento.json` registra os recursos e bytes do menu em contexto Chromium novo. O vídeo não é requisitado nessa abertura. `publicacao.json` contém os arquivos públicos, incluindo as opções, as artes de todas as cinco fases e o vídeo final. `retirados.json` lista os 269 binários históricos fora desse fluxo, com tamanhos e commit de recuperação. A limpeza não apaga controladores nem fontes de criação.

## Validação

```sh
npm run build
npm run check:site
npm run test:build
node desenvolvimento/raizes/desempenho.cjs
node desenvolvimento/raizes/medir-carregamento.cjs
```

A suíte atual conclui as cinco fases acionando objetivos, equipamentos, perguntas, plantio, coleta e recompensas pelas interfaces reais. Roda com teclado e com eventos de toque, verifica salvamento, animais nos habitats após recarregar e o filme automático. A geometria verifica reservatório, ponte, rio, cercas, portões, fonte, moradores e canal, além dos percursos de todos os objetivos. Os testes anteriores ficam como documentação das versões anteriores.

Para atualizar o manifesto, execute a campanha e a suíte de interface e depois `node desenvolvimento/raizes/publicacao.mjs`. O gerador combina suas capturas locais de requisições, as entradas HTML/CSS e os bancos opcionais de arte. Revise o JSON antes de publicar: não confie em capturas incompletas.

## Criação da arte

`preparar-arte.py` converte as pranchas geradas em WebP e mede quadros e engates da mangueira. As entradas PNG indicadas no script são arquivos de geração desta sessão; não são dependências de compilação. Os WebP e o atlas prontos estão versionados. O título tem arquivo WebP separado. As novas ilustrações foram produzidas com a ferramenta de geração de imagens; o acabamento e a animação usam SVG, CSS e Canvas.

O roteiro da história usa a premissa informada na conversa. O documento de história anunciado na última solicitação ainda não foi anexado; seu texto específico não foi inventado. Os nomes seguem os nomes completos anteriormente confirmados: Hicham ocupa o crédito de programação referido como “Richard” na transcrição.
