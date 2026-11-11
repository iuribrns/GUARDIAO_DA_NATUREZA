# Arte e movimento da campanha

Esta pasta acrescenta uma revisão compartilhada às cinco fases, sem substituir as pastas anteriores.

- **88 quadros novos:** 32 de Kai andando, 32 com a mangueira, 16 de Flora e oito de fogo. Cada direção de caminhada tem quatro quadros, sincronizados à distância percorrida. A mangueira continua dependendo da animação de equipar.
- **Cinco cenários com nova iluminação**, incluindo suas versões restauradas. A composição mantém os caminhos, reservatório, pontes, pontos de entrada e objetivos das pinturas aprovadas.
- **Recuperação com borda suave**, folhas e anéis de conquista, sombras de copas com vento, pequenos rastros ao andar e ondas ao nadar. Os efeitos decorativos respeitam a redução de movimento. As máscaras de recuperação são armazenadas em cache, sem criar uma tela por quadro.
- **Jato de água animado**, com três filetes e gotas que percorrem o trajeto.
- **Copas transparentes ao passar atrás** na primeira fase, para manter Kai visível.
- **Painéis, botões e joystick com arte vetorial** de madeira e folhas. A mesma linguagem aparece nas configurações e em Sobre o jogo.
- **Colisões nos pés:** contato completo com elipses e margem dos polígonos nas fases da jornada; amostragem mais densa do chão na floresta; subpassos de até 1,5 unidade; deslizamento nos eixos livres. A aproximação de objetivos tenta mais distâncias quando o primeiro anel não cabe junto de uma borda.

`movimento.js` contém a geometria compartilhada. `vida.js` carrega os novos sprites, escolhe os quadros, compõe os efeitos e redireciona as dez pinturas para suas exportações WebP. `atlas.js` e `assets/atlas.json` mantêm os recortes dos novos quadros. As pranchas antigas continuam presentes, mas as que foram substituídas deixam de ser baixadas durante a fase.

As fontes PNG, os quatro arquivos de animação `.aseprite`, os dois cenários de floresta em camadas `.kra`, os vetores e os mapas para inspeção ficam em `desenvolvimento/arte-natural/`. Essa pasta de fontes não é copiada para o site publicado.

## Verificação

Da raiz do repositório:

```sh
node jogo/vida-natural/validacao/fisica.cjs
node jogo/vida-natural/validacao/arte.cjs
```

A segunda verificação precisa do servidor local em execução, ou de `GUARDIAO_TEST_URL` apontando para o menu. Ambas estão incluídas em `npm test` e `npm run test:build`, junto das suítes completas de conclusão das fases e dos controles por toque.

O teste de física usa casos independentes para círculos, elipses, paredes finas, deslizamento, reservatório, ponte e entrada no rio, além da acessibilidade dos objetivos. O teste de arte examina os pixels dos 88 recortes, a passagem dos quatro quadros de caminhada, repouso e pausa de Flora, redução de movimento e carregamento das pinturas novas.
