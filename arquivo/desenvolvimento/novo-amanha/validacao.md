# Validação do plano — 29/10/2026

O navegador de verificação foi Chromium, com teclado, toque emulado e tamanhos 320×740, 390×844, 667×375, 844×390 e 1280×720. As verificações usam contextos isolados; nenhum salvamento de jogador real é editado.

## Campanha

- Campanha completa em celular emulado: entrada pelo menu, conversa e entrega de equipamentos, mangueira retirada da mochila, oito focos, três animais e premiação da fase 1; fases 2–5 com todos os objetivos; cinco cristais e epílogo. **Passou.**
- Campanha completa com teclado na cópia de produção: mesmos objetivos, respostas erradas e nova tentativa, escolha de sementes apropriadas, proteção das mudas, reciclagem, mobilidade e comunidade. **Passou.**
- Itens e coleta do rio continuam após recarregar. Traje obrigatório, ação de vestir, Flora continua voando e o jogador não pode retirar a proteção durante a atividade. **Passou.**
- Inventário não concede conquistas; o epílogo exige as cinco fases. Pausa, repetição, avanço das seis cenas e créditos preservam a conquista. **Passou.**

## Interface, física e arte

- Mapa realmente em tela inteira, cinco regiões clicáveis, versão vertical, restauração só após a conclusão e marcador de Kai reposicionado ao girar a tela. **Passou.**
- Mochila em três abas, bloqueios, cristais, uniformes e retorno à fase. **Passou.**
- Uma conversa por entrada de fase, diálogos fechados ocultos, retratos recortados corretamente, instruções por dispositivo, biomas e perguntas com novas tentativas. **Passou.**
- Ponte, margem do rio, reservatório, deslocamento oblíquo, colisão nos pés e caminhos dos animais. **Passou.**
- Natação nas oito direções: medição dos pixels confirma rosto/visor visíveis e corpo translúcido sob a água. Revisão visual retirou o recorte horizontal que escondia demais a cabeça e os rótulos próximos sobre o rosto. **Passou.**
- Pranchas completas, bordas transparentes, asas de Flora, mangueira, jato, impactos e oito engates. **Passou.**
- Cinco cristais nas cores corretas, colar inicialmente vazio, encaixe da pedra, Kai vestindo o amuleto, movimento reduzido e salvamento. **Passou.**
- Iuri e Hicham com quatro poses por pessoa, referências ao lado, galeria responsiva, toque, teclado, piscadas e professor preservado. **Passou.**
- Música, efeitos, volumes, ativação por gesto, pausa, cancelamento, armazenamento bloqueado e falha de áudio recuperável. **Passou.**
- Navegação dos três botões do menu, folhas, transições, movimento reduzido e falta de CSS sem bloquear a navegação. **Passou.**

## Distribuição

`npm run build`, `npm run check:site`, validação sintática dos controladores e `git diff --check` conferem a compilação, os caminhos relativos, os ativos públicos e a ausência de erros de formatação. A validação de interface e de profundidade do rio também é executada no resultado do build.

Os PNGs de criação e o plano original permanecem em `desenvolvimento/novo-amanha/`; apenas os arquivos públicos e WebP são copiados para o site. Não houve exclusão de arquivos ou pastas existentes.
