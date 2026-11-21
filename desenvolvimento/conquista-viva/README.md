# Kits de HUD e missão concluída

As artes enviadas estão em `jogo/conquista-viva`: 26 WebPs, com dimensões e transparência preservadas. Somam 2 566 252 bytes, contra 21 031 055 bytes dos PNGs utilizados. Kai e Flora são compartilhados entre os dois kits, sem duplicar arquivos. Atlas e referências com textos impressos não são publicados.

O HUD mantém os objetivos, botões e contadores existentes, com moldura e ícones novos. As barras acompanham o valor real do medidor nativo. Tela cheia conserva os estados de entrar e sair. A arte inclui a borda completa dos controles, sem adicionar um segundo aro.

As cinco conclusões compartilham a nova moldura e os cartões de resultado. As fases 1 e 2 usam os personagens e cenários restaurados fornecidos; as demais preservam os aliados e as animações existentes. Os colares de um e dois cristais aparecem quando correspondem ao progresso atual; outras combinações usam o relicário dinâmico. A animação de encaixe continua funcionando no mesmo painel. Permanece apenas a ação de avançar, com encerramento após a quinta fase.

As artes de celebração carregam ao receber a recompensa ou abrir a conclusão. A decoração dos resultados observa alterações nos contadores sem executar novamente a cada quadro da animação.

Com o preview de produção na porta 4189, execute `node desenvolvimento/conquista-viva/verificar.cjs`. A verificação cobre as cinco fases em computador e celular, contadores, barras, tela cheia, mochila, pausa, limites dos painéis, progresso do colar, teclado/toque e avanço.

`node desenvolvimento/conquista-viva/passagem.cjs` percorre a animação real da recompensa até a conclusão e avança nas cinco fases com Enter e toque. A saída esconde explicitamente o painel, fecha o diálogo e remove a prévia da recompensa antes da transição. A verificação acompanha o documento anterior, o mapa e a chegada à próxima fase para impedir banners residuais.
