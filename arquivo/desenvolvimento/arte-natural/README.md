# Fontes editáveis e produção da arte

O fluxo desta revisão usa as ferramentas instaladas na nuvem. As artes anteriores permanecem em suas pastas. O Canva não estava exposto como ferramenta acessível nesta sessão; nenhuma etapa depende de uma conta do Canva.

## Fontes

- `fontes/kai-andando.png`: oito direções × quatro poses.
- `fontes/kai-mangueira.png`: oito direções × quatro poses, segurando o equipamento.
- `fontes/flora.png`: oito poses de voo, quatro de pouso e quatro de repouso/comemoração.
- `fontes/fogo.png`: oito poses de chamas pintadas.
- Os quatro `.aseprite` correspondentes contêm **linhas do tempo reais**, com 32, 32, 16 e oito quadros. As direções de Kai seguem E, NE, N, NO, O, SO, S e SE, em grupos de quatro.
- `fontes/floresta-inicio.kra` e `floresta-restaurado.kra`: pintura original e iluminação em camadas separadas.
- `fontes/*.svg`: painéis de madeira, folhas, botões, sombras, iluminação e estudo vetorial de fogo. O fogo usado no jogo é a prancha pintada; o estudo vetorial permanece como fonte de design.
- `mapas/*.tmj`: referências das cinco fases no Tiled, com cenário, sólidos nos pés, limites e marcadores de objetivos. Os JSON correspondentes foram exportados pelo Tiled.

As novas pranchas pintadas foram produzidas a partir das referências aprovadas de Kai e Flora, com geração de imagens. Os vetores foram definidos em SVG e exportados pelo Inkscape. A composição e exportação dos cenários em camadas foram feitas pelo Krita. O LibreSprite recortou os quadros e importou suas sequências numeradas como animações editáveis. WebP é apenas o formato de distribuição; as fontes preservam a transparência e a resolução original.

## Reproduzir as exportações

```sh
cd /workspace/GUARDIAO_DA_NATUREZA
python3 desenvolvimento/arte-natural/produzir.py
node desenvolvimento/arte-natural/preparar-mapas.mjs
```

Os comandos usam `/workspace/.tools/guardiao/bin/`; `GUARDIAO_TOOLS_DIR` permite alterar o diretório das ferramentas. Consulte `/workspace/.tools/guardiao/design/README.md` para a instalação local dos editores.

`produzir.py` usa o Inkscape para os vetores e a camada de luz, empacota essa camada e o cenário original em OpenRaster, usa o Krita para exportar os cenários, o LibreSprite para as sequências de animação e o encoder `cwebp` para o jogo. Pillow lê dimensões e limites alfa para os metadados; não redesenha os pixels. As saídas públicas ficam em `jogo/vida-natural/assets/`.

As pinturas WebP já exportadas são preservadas em execuções seguintes. Para refazer uma delas após mudar a luz, mova a saída correspondente para uma cópia de segurança antes de executar o script. Os sprites e as animações editáveis são reexportados quando sua fonte PNG fica mais recente. `cenarios.json` registra o tamanho das dez pinturas distribuídas.

## Conferir colisões

Abra um `.tmj` no Tiled e ligue as camadas coloridas. O cenário mede 1672 × 941 pixels; o mundo lógico mede 1280 × 720. O script aplica essa escala aos objetos. Esses arquivos são referências de inspeção: mudanças neles precisam ser incorporadas às definições de navegação do runtime antes de afetar o jogo. Eles não alteram a colisão automaticamente.

No navegador, acrescente `?colisoes` à primeira fase ou `?fase=2&colisoes` à jornada para ver os limites atuais. Os testes de física e as suítes de jogo verificam que os objetivos continuam alcançáveis.
