# Apresentações e praça de reciclagem

As apresentações usam as artes originais de Kai, Flora e dos cinco NPCs.
Flora ganhou tamanho e espaço no ombro, e a dupla fica mais ao centro, com
um pequeno ajuste de saturação. Os NPCs alternam poses de conversa e escuta,
com respiração e movimento leve, respeitando a opção de reduzir animações.
As informações têm placas verdes e papel claro; no celular, o painel fica
menor e a rolagem permanece apenas no conteúdo quando necessário.

O desenho das três lixeiras já existia, mas não era preparado pelo novo
carregamento de arte. `jogo/clareira/cidade.js` carrega somente esses três
desenhos na cidade e insere cada lixeira na ordenação de profundidade.
As bases ficam nos três pisos da praça: (154,514), (225,493), (300,472).
Os obstáculos correspondentes e o ponto acessível de reciclagem (240,535)
ficam em `jogo/reencontro/conteudo.js`, antes da criação dos dados de navegação.

Em `jogo/correnteza/rio.js`, a natação usa escala de 78%, conservando o ponto
de apoio, a submersão, as ondas e a coleta alinhada à mão e à bolsa.

## Verificação

`GUARDIAO_TEST_URL=http://127.0.0.1:4189/jogo/viva/ node desenvolvimento/clareira/verificar.cjs`

O teste abre as cinco apresentações em três resoluções, verifica o encaixe
no celular, os desenhos das lixeiras, as colisões e a reciclagem por Enter
e toque. As suítes `encontros-vivos`, `rio-claro` e `trilhas-vivas/colisoes`
cobrem as poses, a natação e o acesso aos objetivos das cinco fases.
