# Restauração progressiva da ilha

`jogo/ilha-renascendo/` contém as cinco imagens enviadas pelo usuário e o compositor do mapa. As fases jogáveis, os sprites de Kai, Flora e NPCs, os ícones e as placas continuam os mesmos.

Ordem dos anexos utilizada:

1. `1000197508.jpg`: floresta recuperada.
2. `1000197516.jpg`: rio recuperado.
3. `1000197515.jpg`: fauna recuperada.
4. `1000197510.jpg`: reflorestamento recuperado.
5. `1000197509.jpg`: cidade recuperada, com a Árvore Guardiã ainda enfraquecida.

As conversões WebP são sem perdas, nas dimensões dos anexos (1280×720 ou 1280×721). Não houve geração de uma arte nova, corte ou retoque de personagens/texturas. O mapa inicial anterior foi conservado porque ainda não veio a referência anterior à primeira restauração.

A transição de seis segundos parte do território concluído e revela a etapa seguinte com uma borda gradual. O instante inicial só é definido depois que as imagens necessárias foram decodificadas. O avanço para o encerramento também espera esse carregamento. Com redução de movimentos, a recuperação aparece diretamente.

A tela usa ajuste proporcional para mostrar a ilha inteira. As regiões são acumuladas conforme as fases concluídas, o estado persiste no navegador e o reinício limpa também a restauração visual. Somente a etapa atual, a anterior, a próxima e o estado inicial ficam no cache do compositor. A próxima etapa é preparada durante a ociosidade, respeitando economia de dados.

O encerramento anterior continua disponível: sua árvore saudável existente é limitada ao centro da ilha, preservando os cinco territórios recebidos. Este trabalho não substitui o vídeo final pela referência do ZIP, que ainda não pôde ser aberto por exceder o limite de transferência.

Verificação: `GUARDIAO_TEST_URL=http://127.0.0.1:4189/jogo/viva/ node desenvolvimento/ilha-renascendo/verificar.cjs`. São testadas as cinco recuperações, o estado intermediário, igualdade de pixels com cada imagem fornecida, salvamento/reabertura, reinício e proporções em computador e celular deitado.
