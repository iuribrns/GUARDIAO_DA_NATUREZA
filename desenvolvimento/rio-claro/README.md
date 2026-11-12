# Rio, conclusão e configurações

A implementação está em `jogo/rio-claro/`. As artes anteriores continuam no repositório.

- `atlas.js` e `assets/`: 20 poses de nado/coleta de Kai, 12 poses dos animais e um galho ilustrado. As oito poses frontais de nado preservam a arte anterior; as novas poses mantêm o traje de mergulho e os cachos.
- `rio.js`: carrega explicitamente os sprites da fase 2, desenha Kai nas oito direções e anima o objeto real até a bolsa. Rede, plástico e canudo integram as poses dos animais; o antigo contorno geométrico não é sobreposto. A libertação é gradual e o animal continua no seu habitat.
- `conclusao.js`: reutiliza os personagens e o relicário originais num resumo compartilhado pelas cinco fases. Mantém os IDs e as ações de progresso e exploração.
- `configuracoes.js` e `interface.css`: galho, placa de madeira, folhas e tipografia da interface, com ajustes para celular deitado e redução de movimento.

`empacotar.py` recebe três arquivos de arte (poses, animais e galho), isola cada célula, preserva margens transparentes e exporta WebP. Não desenha nem altera os personagens. As novas ilustrações foram produzidas com a ferramenta de geração/edição de imagens, usando as artes anteriores como referência.

Verificação: compilar com `npm run build`; executar `node desenvolvimento/rio-claro/verificar.cjs` com `GUARDIAO_TEST_URL` apontando para `/jogo/viva/` do servidor. O teste confere pixels visíveis do corpo e cabeça em oito direções, coleta/resgate, e o resumo das cinco fases em 1280×720, 844×390 e 740×320. O teste de campanha percorre as tarefas reais com teclado e toque, incluindo vestimenta, lixo na bolsa, animais no habitat, recompensa, salvamento e próxima fase.
