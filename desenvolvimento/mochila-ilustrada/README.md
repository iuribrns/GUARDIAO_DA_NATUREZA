# Mochila do mapa com os kits Colar e Trajes

Os dois ZIPs fornecidos são a fonte da moldura, cabeçalho, abas, cartões,
colar, cinco cristais e cinco trajes. A imagem completa de referência e os
atlases repetidos não são publicados. Os 13 componentes usados passaram de
9.449.995 para 988.906 bytes em WebP, qualidade 88 (89,5% menores), preservando
dimensões e transparência.

O renderizador `jogo/mochila-ilustrada/mochila.js` monta as peças com texto e
estado reais. Os cantos e as bordas dos painéis vazios são reutilizados por
recortes SVG; personagens, cristais e colar conservam sua proporção. As áreas
transparentes dos itens são enquadradas pelo atlas, sem alterar os arquivos.

Os cinco cartões de traje têm uma única pose cada, permanecem visíveis e
acinzentados antes do desbloqueio. Somente o traje atual recebe destaque,
marca e legenda de uso. O colar mantém neutros os encaixes ainda não obtidos,
e a contagem e as marcas dos cristais seguem as fases concluídas. Ler a
mochila não altera a memória da partida.

O tema é habilitado na mochila do mapa. A mochila dentro das fases continua
com seu renderizador atual, incluindo a ação de preparar equipamento.
Ferramentas, teclado, toque, fechamento e atualização da memória usam o
mesmo controlador compartilhado.
O fechamento por B interrompe a propagação da tecla, evitando que o atalho
global reabra a mochila no mesmo evento.

Os componentes só são buscados ao abrir a mochila e a aba correspondente.
A verificação cobre progresso inicial, parcial e completo em computador e
celular, alinhamento, contraste, desbloqueios, navegação e atualização da
coleção sem alterar a partida.
