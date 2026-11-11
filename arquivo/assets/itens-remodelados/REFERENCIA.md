# Guardião da Natureza — colar, mochila e ações dos itens

Esta revisão substitui as antigas recompensas por um único colar montável. O pacote contém 15 folhas PNG com transparência.

## Colar

O colar tem um cordão marrom fechado e um pingente de bronze com cinco encaixes. Cada fase acrescenta uma peça ao mesmo pingente. Quando as cinco peças estão instaladas, o pingente ganha a forma de uma folha dourada.

| Arquivo | Organização e conteúdo |
|---|---|
| colar/01_progressao.png | 4 colunas × 2 linhas: vazio; uma peça; duas; três; quatro; cinco; completo com brilho; completo sem brilho |
| colar/02_encaixe_e_transformacao.png | 6 colunas × 2 linhas: primeira linha encaixa a primeira peça; segunda linha transforma o colar completo |
| colar/03_pecas_e_base.png | 3 colunas × 2 linhas: peça vermelha, azul, âmbar; peça verde, amarela, base vazia |
| colar/04_kai_recebendo_colar.png | 4 colunas × 3 linhas: quadros 1–6 mostram o primeiro encaixe; quadros 7–12 mostram Kai erguendo o colar completo |
| colar/05_encaixes_fases_2_a_5.png | 6 colunas × 4 linhas: encaixes azul, âmbar, verde e amarelo, uma sequência por linha |

Leia da esquerda para a direita e depois passe à linha seguinte. A ordem das peças é vermelha, azul, âmbar, verde, amarela. Os encaixes acumulam as peças recebidas nas fases anteriores.

## Mochila

mochila/01_estados.png — 4 colunas × 3 linhas.

| Linha | Coluna 1 | Coluna 2 | Coluna 3 | Coluna 4 |
|---|---|---|---|---|
| 1 | Fechada de frente | Costas com alças | Lado direito | Lado esquerdo |
| 2 | Abrindo | Mais aberta | Aberta vazia | Mangueira saindo |
| 3 | Kit saindo | Sementes saindo | Regador saindo | Fechada |

## Ícones dos equipamentos

itens/01_icones.png — 4 colunas × 2 linhas.
Primeira linha: mangueira, kit médico/veterinário, sementes, regador.
Segunda linha: sacola de lixo, luvas, ração, rede de resgate.

## Kai retirando e usando cada item

Todas as oito folhas da pasta kai têm 6 colunas × 2 linhas, com doze quadros por item.

**Linha superior:** alcançar a mochila; trazê-la à frente; abrir a tampa; colocar a mão dentro; puxar o item; apresentar o item com a mochila retornando às costas.

**Linha inferior:** seis poses de uso do equipamento. Kai permanece em pé durante as sequências. Não há retirada de item do chão nem agachamento.

| Arquivo | Ação |
|---|---|
| kai/01_mangueira.png | Preparar, mirar e soltar água |
| kai/02_kit_medico.png | Abrir o kit, retirar e aplicar uma bandagem no próprio braço, fechar o kit |
| kai/03_sementes.png | Abrir o saquinho e espalhar sementes, com broto ao final |
| kai/04_regador.png | Erguer, inclinar e regar |
| kai/05_sacola.png | Abrir a sacola, colocar uma garrafa e fechar |
| kai/06_luvas.png | Vestir e ajustar as duas luvas |
| kai/07_racao.png | Abrir a ração e espalhar uma porção |
| kai/08_rede.png | Preparar e estender a rede, fazer movimento de recolhimento |

As ações laterais estão orientadas à direita. Para atuar para a esquerda, espelhe cada quadro no jogo, mantendo a ordem dos quadros. A sequência de retirada também pode ser reproduzida ao contrário como base para guardar o item.

## Uso no projeto

Os arquivos são folhas de arte geradas por imagem. A transparência foi conferida. Antes de integrar, recorte e alinhe os quadros pelos pés e pelo ponto de origem do personagem. Confira os limites reais dos efeitos: água e brilho podem ocupar margens além da grade visual. A escala do colar apresentado de perto e a escala dele no peito do personagem precisam ser ajustadas na implementação.

As poses e efeitos ilustram as ações; colisões, alcance, consumo de itens, crescimento de plantas, cura e duração são programados separadamente.
