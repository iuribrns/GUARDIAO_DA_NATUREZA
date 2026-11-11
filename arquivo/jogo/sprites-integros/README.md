# Sprites completos

Esta revisão reúne **330 quadros em 24 pranchas WebP**, com transparência preservada e 12 pixels de margem nas células. Os arquivos e as pastas anteriores continuam no projeto.

- Kai: caminhada nas oito direções, caminhada com mangueira, repouso, cuidados, natação, plantio e resgates.
- Flora: volta ao desenho aprovado de `floresta-viva/revisao/assets/flora-suave.png`, com asas completas, rosto ancorado, voo maior, pouso e comemoração.
- Animais, NPCs, itens e ícones: silhuetas separadas por componente, incluindo detalhes que ultrapassavam os recortes antigos.
- Colar: oito novas poses de Kai recebendo, levantando, vestindo e ajustando o cordão.

`atlas.js` aplica os novos caminhos e recortes antes de carregar os renderizadores existentes. Mantém as contagens e os nomes públicos dos atlas para preservar as animações de cada fase. O arquivo JSON guarda os caminhos originais desta pasta; o JavaScript adapta esses caminhos às três classes de sprites.

A natação exclui as poses da imagem de origem que não são usadas. Antes, algumas gotas de uma pose vizinha faziam outra figura inteira entrar no recorte. O empacotador ignora componentes com sobreposição mínima e mantém apenas a silhueta correspondente.

## Verificação

Com o servidor `npm run dev` aberto:

```bash
node jogo/sprites-integros/validacao/quadros.cjs
node jogo/colar-vivo/validacao/colar.cjs
```

A primeira verificação lê as imagens efetivamente servidas, procura pixels nas margens de cada quadro, restos vizinhos, sobreposições, quadros vazios e variações indevidas de tamanho na caminhada e na natação. Ela também faz parte de `npm test` e `npm run test:build`.

As fontes e a reprodução do empacotamento estão em `desenvolvimento/recortes/`.
