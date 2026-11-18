# Personagens em conversa e descanso

`jogo/encontros-vivos/cenas.js` compõe as cinco apresentações e os diálogos com as artes originais. Flora pousa no ombro de trás, afastada do rosto de Kai. Usa as poses pousadas já existentes para piscar e alternar o olhar entre o jogador e o NPC. Kai respira e inclina levemente o corpo; os aliados alternam gestos de escuta e conversa.

Dentro das fases, a respiração e o balanço de Kai se aplicam ao desenho, com os pés fixos e sem modificar posição, direção física ou hitbox. Os NPCs respiram e fazem pequenos gestos. A Flora pousada acompanha a respiração do ombro; seu voo e a regra de acompanhar Kai voando no rio continuam preservados. As animações respeitam a redução de movimentos.

Nenhuma imagem ou textura foi substituída. O teste `verificar.cjs` confere as apresentações das cinco fases em computador e celular, diferenças visuais ao longo do tempo, estabilidade com redução de movimento e a preservação das coordenadas e do contexto de desenho nos cinco trajes.
