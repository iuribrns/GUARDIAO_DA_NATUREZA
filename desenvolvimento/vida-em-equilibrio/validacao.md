# Validação do plano consolidado — 02/11/2026

## Campanha de ponta a ponta

- **Celular emulado:** campanha inteira desde o menu, com joystick, toque e interações reais. A reserva exigiu retorno ao registro antes de concluir os oito focos; três resgates da primeira fase; proteção e limpeza do rio; nove animais na missão de fauna; seis plantas escolhidas livremente e regadas; três atividades urbanas; cinco recompensas; recuperação da ilha e entrada no destino 6; seis cenas do epílogo. **Passou.**
- **Computador:** o mesmo percurso com teclado, na cópia de produção. **Passou.**
- Respostas erradas permitem tentar novamente; explicação fica disponível antes do cuidado. Escolhas de plantas incluem as três espécies, sem espécie obrigatória por canteiro. Resíduos são classificados em recicláveis, orgânicos ou rejeitos. **Passou.**

## Interface e apresentação

- 1280×720, 390×844, 320×740, 844×390 e 667×375: mapa em tela inteira, seis destinos alcançáveis, sem sobreposição das placas e sem rolagem lateral da página. **Passou.**
- Mochila nas três abas, nenhum falso desbloqueio, roupas somente para consulta, cristais com cinco silhuetas diferentes e manutenção do estado ao fechar. **Passou.**
- Introduções curtas, um diálogo visível por vez, toque/cancelamento nas cinco fases, mudança explícita de controles e retorno à aventura. **Passou.**
- Tablet com toque e ponteiro fino detectado como celular; preferência de teclado preservada ao girar e recarregar. **Passou.**
- Renderização dos moradores: três aparências diferentes efetivamente desenhadas, desde o início, nas cinco fases. **Passou.**
- Natação: cabeça e visor visíveis e corpo submerso nas oito direções; oito poses próprias de nado para baixo. Nova revisão das poses solares remove o visor e preserva o uniforme de voluntário. **Passou.**
- Tela inicial e seção aprovada de missões preservadas byte a byte em comparação com `df61260`. Demonstração de controles, conteúdo resumido dos biomas e avatares revistos visualmente no celular. **Passou.**

## Regressões

- Contato oblíquo, círculo/elipse, parede fina, deslizamento, caminhos, reservatório, ponte e rio. **Passou.**
- Cinco pedras com as cores correspondentes, amuleto inicialmente vazio, encaixe, Kai vestindo, pausa, toque e salvamento. **Passou.**
- Início no horizonte, piscadas, fogo distante, mapa nas orientações retrato/paisagem, restauração, epílogo após as cinco conquistas, movimento reduzido e comemoração no campo. **Passou.**
- Música e efeitos, gesto para ativar som, volumes, cache, pausa, mangueira contínua, cancelamento e falha de áudio recuperável. **Passou.**
- Compilação e integridade dos caminhos/ativos públicos: `npm run build` e `npm run check:site`. **Passou.**
- Sintaxe e formatação: controladores conferidos com Node; `git diff --check` sem problemas.

## Alcance

As verificações usam Chromium com contextos isolados e emulação de celular. Não substituem testes em aparelhos físicos e em outros navegadores. Os salvamentos utilizados nos testes não são os de jogadores reais. Os arquivos anteriores foram preservados; não houve exclusão de pastas.
