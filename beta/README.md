# Beta — Amazônia em Chamas

Adaptação do protótipo de `hichas23/Guardiao_da_Natureza`, preservado no outro checkout. Todo o código desta versão está nesta pasta; as artes compartilhadas estão em `../assets`.

## Executar

Na raiz deste novo repositório:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Abra `/beta/index.html` no servidor. Também é possível abrir este `index.html` diretamente no navegador. Não são necessários npm, build, banco de dados, chaves ou acesso a serviços externos.

## Jogar

- A/D ou setas: andar.
- Espaço, W ou seta para cima: pular.
- E, Enter ou USAR: interagir e avançar diálogos.
- F ou FALAR COM FLORA: conversar com a coruja.
- No celular, use os botões de movimento, salto e interação.

Pegue a mangueira, atravesse as plataformas e apague os três focos de incêndio. A conclusão mostra a opção de reiniciar.

## Ajustes desta versão

Caminhos das artes compartilhadas, interação com E, diálogo da Flora separado dos itens, limpeza dos controles ao perder o foco, reinício dos diálogos e câmera, retorno a chão seguro ao cair no rio, proporção dos sprites de Kai e remoção de logs a cada frame.

## Limites

Esta beta contém apenas a fase 1. Mangueira, fogo e algumas plataformas ainda são desenhados pelo Canvas. Não há salvamento de progresso, áudio ou outras fases. A nova prancha de quatro direções anexada à conversa aguarda o arquivo original.
