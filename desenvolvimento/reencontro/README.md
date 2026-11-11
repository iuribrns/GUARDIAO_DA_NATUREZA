# Revisão de mapas, caminhada e resgates

Código e artes desta revisão ficam em `jogo/reencontro/`. Os arquivos históricos
continuam preservados. As paisagens ilustradas aprovadas foram copiadas para o
catálogo ativo; a publicação não lê a pasta `arquivo/`.

- O mapa da ilha e os cinco cenários recuperam o desenho ilustrado. As interações
  continuam no cenário, com restauração gradual, reflexos e partículas leves.
- 228 poses de Kai foram isoladas em células com margem transparente. A divisão
  uniforme antiga cortava cabelos/pés e incluía pedaços da linha vizinha. Os
  pivôs agora acompanham o corpo, sem o salto horizontal das células antigas.
- Flora usa os quadros completos de voo, aproximação, pouso e decolagem, com um
  único desenho por quadro. No rio ela continua voando.
- A fauna tem nove resgates. Redes, galhos, gaiolas e curativos mostram o problema
  antes da interação. A resposta correta inicia um cuidado curto no cenário,
  sem outra tela de confirmação.
- Os peixes são libertados das embalagens no próprio rio. Oito novas poses de Kai
  com o traje de proteção substituem a sequência que o colocava num aquário.
- Partidas anteriormente concluídas continuam válidas após a ampliação da fauna.

## Verificações

```sh
python3 desenvolvimento/reencontro/verificar-poses.py
node desenvolvimento/reencontro/flora.cjs
node desenvolvimento/trilhas-vivas/colisoes.cjs
npm run build
npm run check:site
npm run test:build
```

O teste de campanha percorre os objetivos de todas as fases com teclado e toque,
incluindo os nove animais. Confere também que o animal permanece no habitat
durante a nova animação do rio. A revisão do mapa compara pixels antes/depois de
reiniciar a jornada para detectar uma restauração que permaneça em cache.

`medir-quadros.py` recria as pranchas de caminhada/equipamentos a partir das artes
originais. Requer Pillow, NumPy e SciPy nas ferramentas de desenvolvimento.

Na revisão de 11/11/2026, passaram as verificações de poses, Flora, colisões,
compilação e caminhos publicados. O navegador passou pela interface em cinco
resoluções e pelos painéis de pausa/mochila. O teste detectou uma falha no início
da restauração; ela foi corrigida, mas a solicitação para repetir o percurso
completo no navegador foi cancelada. A conclusão das cinco fases com teclado e
toque permanece pendente de confirmação nesta revisão.
