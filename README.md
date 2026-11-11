# Guardião da Natureza

Aventura de exploração para crianças de 5 a 10 anos. Kai e Flora cuidam de cinco regiões e restauram a Árvore Guardiã. Funciona em **paisagem**, no computador e no celular.

**[▶ Jogar agora](https://iuribrns.github.io/GUARDIAO_DA_NATUREZA/)** · [Código atual](jogo/trilhas-vivas/) · [Guia de desenvolvimento](desenvolvimento/README.md)

## Onde está cada coisa

| Pasta                                         | Conteúdo                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [jogo/](jogo/README.md)                       | Menu, cinco fases, artes em uso e módulos compartilhados.                                  |
| [desenvolvimento/](desenvolvimento/README.md) | Compilação, testes atuais e ferramentas.                                                   |
| [assets/](assets/README.md)                   | Identidade e manifesto compartilhados; as artes das fases ficam junto dos módulos.         |
| [docs/](docs/ESTRUTURA.md)                    | Estrutura e publicação no GitHub Pages.                                                    |
| [entregas/](entregas/README.md)               | Pacotes para baixar.                                                                       |
| [arquivo/](arquivo/README.md)                 | Versões anteriores, artes de criação e testes históricos preservados. Não vai para o site. |

## Executar e conferir

```sh
npm ci
npm run dev
```

Abra o endereço mostrado no terminal. Para compilar e conferir a publicação:

```sh
npm run build
npm run check:site
npm run audit:files
npm run test:build
```

`dist/` é gerada automaticamente e contém somente os arquivos publicados. Não envie `node_modules/`, `arquivo/` ou a pasta inteira do repositório como se fossem o site.

**Controles:** WASD/setas para mover, Enter para cuidar/conversar, B para mochila e Esc para pausa. No celular, use joystick e botões de toque. Áudio, imagem e controles podem ser ajustados no jogo.

Projeto acadêmico da **UNEB**, disciplina Web 1, com apoio do Professor Peterson Lobato. Criação e gestão: Iuri Barroso Nascimento. Programação: Hicham Mohamed El Attar e Eric Nascimento. Design: Natson Evangelista.
