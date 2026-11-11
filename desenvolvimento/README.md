# Desenvolvimento

O jogo atual é HTML, CSS e JavaScript. O servidor abre diretamente o menu; a compilação publica somente o fluxo atual e seus recursos.

| Local                        | Responsabilidade                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `organizacao/`               | Catálogo de recursos, grafo dos scripts/estilos, entrada da compilação e auditoria da mudança. |
| `viva/`                      | Cópia do site, manifesto gerado, verificação e executor da suíte atual.                        |
| `trilhas-vivas/`             | Testes e medições da revisão atual; exportação dos arquivos JavaScript.                        |
| `scripts/` e `editores.json` | Instalação e verificação dos editores opcionais.                                               |
| `ambiente/`                  | Instruções da nuvem.                                                                           |
| `vite.config.mjs`            | Servidor de desenvolvimento e prévia do site compilado.                                        |

```sh
npm ci
npm run dev
npm run build
npm run check:site
npm run audit:files
npm run test:build
```

Use Node.js 24 LTS. Os testes de navegador usam Chromium/Chrome, indicado por `CHROMIUM_PATH` quando necessário. `npm test` usa o servidor de desenvolvimento; `npm run test:build` usa a publicação em `dist/`.

A compilação lê as entradas e os recursos de `organizacao/recursos.json`, percorre os scripts e estilos referenciados e gera `viva/publicacao.json`. Ao adicionar uma imagem, um som ou um atlas dinâmico, registre o recurso no catálogo e compile novamente. Não acrescente pastas históricas ao manifesto.

Os editores instalados continuam disponíveis por `npm run tools:install` e `npm run check:tools`. Phaser e GSAP ficam somente no pacote opcional de `arquivo/desenvolvimento/laboratorio/package.json`; a instalação normal não os baixa. Para experimentar o laboratório, instale suas dependências dentro daquela pasta. O site atual não carrega o laboratório nem os pacotes do `node_modules`.

Os materiais de revisões anteriores estão em [`arquivo/desenvolvimento/`](../arquivo/desenvolvimento/). Eles são referências históricas, não comandos de validação da versão atual.

## Baixar uma cópia menor

O GitHub Pages recebe somente o site compilado. Para trabalhar sem baixar as artes históricas, também é possível criar um checkout seletivo:

```sh
git clone --depth 1 --filter=blob:none --sparse https://github.com/iuribrns/GUARDIAO_DA_NATUREZA.git
cd GUARDIAO_DA_NATUREZA
git sparse-checkout set .github assets desenvolvimento docs entregas jogo tela-inicial
```

Essa cópia compila e testa o jogo sem a pasta `arquivo/`. Para consultar os materiais históricos ou rodar a auditoria de preservação, inclua-a com `git sparse-checkout add arquivo`. A publicação automática usa o mesmo princípio e obtém apenas as pastas necessárias para compilar o site. Como a compilação estática usa apenas Node.js, o Actions não instala os pacotes de desenvolvimento.
