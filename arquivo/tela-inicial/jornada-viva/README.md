# Ilha e diário da natureza

A nova seleção é aberta por `nova-versao/aventura.html`. `mapa.js` controla uma ilha ilustrada, com seis áreas e botões HTML acessíveis. Água, vento, fogo e portal são animados separadamente da pintura; não há reprodução de GIF.

Cada área tem uma máscara sobre a pintura restaurada. A transformação muda a área correspondente e desloca o retrato de Kai. As seis transformações podem ser vistas como **prévia**, inclusive nas regiões bloqueadas, sem salvar objetivos ou fragmentos. Encerrar prévia restaura o estado real. A recuperação após concluir a fase 1 é gravada e seleciona a fase 2.

Apenas Floresta em Chamas tem entrada jogável. As demais áreas exibem aliado, objetivos, equipamento, recompensa e o aviso de desenvolvimento. O botão de início não simula fases inexistentes.

`paginas.css` e `paginas.js` remodelam Configurações e Sobre o jogo: diário com ilustração de Kai plantando, quatro abas, controles em oito direções, mangueira, resgate e dicas de natureza. Os ajustes de lado/tamanho dos controles e dicas usam a mesma chave de preferências existente. Restaurar padrões não apaga conquistas.

As artes novas estão em `assets/`: ilha antes/depois, Kai cuidando da natureza e comemoração com Kai, Flora, Carlos e os animais. O retrato de Kai é desenhado por SVG diretamente na página, usando a prancha existente; assim funciona também em hospedagem estática e subpastas.

Os mapas e scripts anteriores de `selecao-fases/` e `mapa-interativo/` estão preservados. Os dados das missões continuam vindo de `mapa-interativo/conteudo.js`. O treino de plataforma anterior também foi preservado em `desenvolvimento/modelos/legado/treino.html`, fora dos menus do jogo, para validar os componentes antigos sem ensinar controles desatualizados às crianças.
