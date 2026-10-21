# Publicação no GitHub Pages

Repositório: `iuribrns/GUARDIAO_DA_NATUREZA`.

Endereço esperado após a ativação e a primeira publicação bem-sucedida:

https://iuribrns.github.io/GUARDIAO_DA_NATUREZA/

O link da raiz abre diretamente o menu do jogo. Os endereços usam caminhos relativos para manter imagens, scripts e navegação funcionando na subpasta do Pages.

## Ativação inicial

Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. Configuração direta:

https://github.com/iuribrns/GUARDIAO_DA_NATUREZA/settings/pages

O workflow `.github/workflows/pages.yml` publica cada atualização da `main`. Se a configuração for ativada depois do commit, execute **Actions → Publicar jogo no GitHub Pages → Run workflow** uma vez. Depois disso, os próximos pushes são publicados automaticamente.

O fluxo instala as versões fixadas por `npm ci`, executa `npm run build` e `npm run check:site`, envia `dist/` como artefato e publica no ambiente `github-pages`. Não usa chave pessoal gravada no código. A URL da publicação aparece na execução do workflow e no ambiente do GitHub.

## Conferência local

```sh
npm ci
npm run build
npm run check:site
npm run test:build
```

A validação de navegador também abre o site por uma subpasta equivalente à do Pages, conferindo a entrada, os recursos e os controles. Ter os arquivos no GitHub não comprova que o Pages está ativo: confirme o workflow de publicação e a URL pública.
