# Guardião da Natureza

Aventura em HTML, CSS e JavaScript, com foco em celular, exploração em áreas abertas e aparência ilustrada com perspectiva inclinada. Kai e Flora ajudam a natureza em **cinco fases jogáveis**. A sexta fase será desenvolvida depois.

[Jogar no GitHub Pages](https://iuribrns.github.io/GUARDIAO_DA_NATUREZA/) · [Estrutura](docs/ESTRUTURA.md) · [Publicação](docs/PUBLICACAO.md)

| Fase | O que fazer | Aliado | Fragmento |
| --- | --- | --- | --- |
| Floresta em Chamas | Liberar água, apagar oito focos e levar três animais ao abrigo | Carlos | Vermelho |
| Rio Poluído | Nadar, recolher oito resíduos e ajudar peixes e tartaruga | Antônio | Azul |
| Resgate da Fauna | Abrir abrigos com desafios visuais, descer com o gatinho e cuidar da ave | Marina | Amarelo |
| Reflorestamento | Semear/regar seis canteiros e preparar dois ninhos | Rafael | Verde |
| Cidade Sustentável | Separar resíduos, ajustar painéis solares e cultivar jardins | Luciana | Violeta |

Cada fase começa ao lado do aliado, com falas curtas e a entrega dos equipamentos. Kai tem animações próprias para os cuidados: puxar a mangueira, nadar, recolher lixo, ajudar a tartaruga, subir/descer com o gatinho, plantar e regar. Os animais voltam a um local seguro, e a paisagem muda conforme os objetivos são concluídos. A conclusão mostra o fragmento da cor correta e libera o próximo destino.

**A restauração da ilha aparece depois da conquista.** A seleção não oferece prévia nem mostra a região recuperada antes da missão. Seu painel apresenta Kai e o aliado voltados um para o outro, equipamentos e objetivos, sem estimativa de tempo.

## Celular e computador

Em **Configurações** ou na pausa, escolha detectar dispositivo, celular ou computador. A escolha é salva no navegador. No celular, aparecem joystick, equipamento, mão e mochila; no computador, os controles de toque ficam ocultos e funcionam WASD/setas, Espaço, E, B e Esc.

Configurações reúne somente ajustes: som, leitura, animações, controles e dicas. **Sobre o jogo** contém história, como jogar, as cinco missões, o colar e ideias de cuidado com a natureza. Os painéis usam madeira, folhas e texturas verdes, com resposta ao toque/cursor e movimento reduzido.

No rio, Flora continua voando mesmo quando Kai para. Em terra, pode pousar no ombro. Na primeira fase, a mangueira permanece guardada até Kai terminar a animação de tirá-la da mochila. O passarinho está em uma área mais visível, com marca de resgate acima dele.

## Começar e testar

Use Node.js 24 LTS (`.nvmrc`).

```sh
npm ci
npm run dev
```

Abra o endereço informado pelo Vite. A raiz abre diretamente o menu. Na mesma rede, o endereço de rede do servidor permite testar no celular.

```sh
npm test             # Navegação, animações, colisões, cinco fases, salvamento e celular
npm run build        # Gera o site estático em dist/
npm run check:site   # Confere arquivos e caminhos relativos do Pages
npm run test:build   # Repete as verificações na versão compilada
npm run format:campaign # Formata o código novo com Prettier
```

Os testes usam Chromium/Chrome; outra instalação pode ser indicada por `CHROMIUM_PATH`. A publicação é feita por `.github/workflows/pages.yml` a cada push na `main`, com o Pages configurado para **GitHub Actions**. O laboratório de desenvolvimento tem um bundle próprio de Phaser, separado do carregamento do jogo.

## Arquivos e artes

- [`jogo/floresta-viva/`](jogo/floresta-viva/README.md): primeira fase e revisão de colisões.
- [`jogo/jornada/`](jogo/jornada/README.md): fases 2–5, novos mapas, ações, animais, objetos e 198 quadros de pranchas, incluindo os aliados reutilizados.
- [`jogo/sistemas/`](jogo/sistemas/README.md): controles, ícones, progresso e carregamento das imagens.
- `tela-inicial/nova-versao/`: entradas do menu, configurações, sobre e seleção.
- `tela-inicial/campanha/`: seleção remodelada e acabamento dos painéis.
- [`desenvolvimento/otimizacao/`](desenvolvimento/otimizacao/README.md): WebP e relatório de tamanhos.

Os PNGs originais e todas as pastas anteriores foram preservados. O jogo publicado carrega versões WebP, com as mesmas dimensões e transparência, e somente as pranchas da fase escolhida. A medição inicial reduziu as imagens do menu de 9,30 MB para 1,58 MB e da floresta de 32,69 MB para 7,25 MB.

As versões antigas de plataforma, treino e área aberta continuam disponíveis no laboratório e nas pastas preservadas; não são a campanha atual. Os testes mantêm a cobertura dessas versões.

## Ferramentas

GSAP anima o menu; Canvas renderiza a campanha; Vite serve/compila; Playwright Core verifica o jogo; Prettier organiza o código. Phaser, Tiled e LibreSprite seguem disponíveis para desenvolvimento e experimentação.

```sh
npm run tools:install
npm run check:tools
```

As instruções dos editores e do ambiente de nuvem ficam em [desenvolvimento/README.md](desenvolvimento/README.md).
