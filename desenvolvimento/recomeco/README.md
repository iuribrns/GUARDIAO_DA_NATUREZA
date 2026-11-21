# Nova jornada

O painel usa a arte sem textos do kit enviado, convertida de PNG para WebP nas dimensões originais (1774 × 887). A moldura, o emblema e os dois botões pertencem à mesma imagem, preservada em proporção 2:1. Não há botões duplicados sobre os desenhos. Textos e áreas interativas são elementos HTML posicionados nas áreas correspondentes da arte.

Somente o painel necessário é publicado: 197 196 bytes, contra 2 051 802 bytes do PNG. A referência com textos, o atlas e os botões separados não são necessários ao layout e ficam fora do site. A imagem só carrega quando o diálogo é solicitado.

A confirmação usa o reinício existente: remove as cinco fases, itens, cristais e encerramento, mantendo áudio e controles. Continuar recebe o foco inicial. Enter, Escape e toque usam controles nativos.

Ao recomeçar na própria página inicial, a navegação força uma recarga depois de definir o destino. Uma simples troca de hash deixava o inventário e a restauração em memória, mesmo após apagar o armazenamento. A mesma recarga protege páginas que recebem o aviso de reinício de outra aba.

Após `npm run build`, com o preview na porta 4189, execute `node desenvolvimento/recomeco/verificar.cjs`. A verificação cobre quatro resoluções, cancelamento, teclado/toque, reinício completo, preferências e arquivos não relacionados preservados, mapa inicial e o diálogo nas páginas das fases.
