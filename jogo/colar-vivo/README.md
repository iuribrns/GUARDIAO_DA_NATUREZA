# O colar das cinco conquistas

Cutscene compartilhada pelas fases 1 a 5, integrada ao fluxo real de retorno ao NPC e conclusão das missões.

| Fase | Pedra |
| --- | --- |
| Floresta em Chamas | Vermelha |
| Rio Poluído | Azul |
| Resgate da Fauna | Amarela |
| Reflorestamento | Verde |
| Cidade Sustentável | Violeta |

Na primeira conquista, a câmera mostra os cinco encaixes vazios. A pedra da fase percorre a tela e se encaixa no medalhão. Nas próximas conquistas, aparecem as pedras das fases anteriores. Conquistas futuras ficam ocultas. O close usa uma ilustração própria, com as pedras compostas nos encaixes medidos da imagem.

Kai recebe, levanta, passa o cordão pela cabeça, ajusta o colar e comemora ao lado de Flora. São oito poses completas em uma prancha nova. O ponto do medalhão acompanha cada pose; durante a exploração, o pequeno colar também representa as pedras já conquistadas.

A sequência usa os 6,5 segundos da premiação existente. O botão **Continuar a aventura** permite avançar a premiação, depois de cumprir as missões. O botão não conclui objetivos nem libera fases por conta própria: chama o fluxo original de conclusão. A tecla Escape permite pausar, e o relógio da cutscene acompanha a pausa. Com movimento reduzido, o enquadramento fica fixo e a pedra aparece encaixada sem voo ou clarão.

O progresso continua nos registros existentes do navegador. A classe lê esse progresso, mas a gravação da conquista permanece nos controladores de cada fase. Não há necessidade de apagar os jogos salvos.

## Arquivos

- `colar.js`: apresentação, poses de Kai, composição do pequeno medalhão e estado de leitura para validação.
- `colar.css`: painel de madeira e folhas, com layouts para computador e celular em pé/deitado.
- `geometria.js` e `assets/geometria.json`: cinco máscaras medidas, cores e posições.
- `assets/colar-vazio.webp`: ilustração do colar sem pedras.
- `validacao/colar.cjs`: integração com saves isolados antes da premiação, verificação das cinco fases, pausa, toque, movimento reduzido, cores e persistência. As validações completas da floresta e da campanha continuam cumprindo todos os objetivos por comandos reais.
