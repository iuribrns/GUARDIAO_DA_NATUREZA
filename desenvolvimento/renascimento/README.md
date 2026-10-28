# Renascimento da natureza

Redesenho da campanha de cinco fases, menu, mapa completo, retratos da equipe e encerramento.

## Arquivos e artes

- `fontes/`: originais PNG das novas artes. Permanecem fora da publicação de produção.
- `preparar.py`: exporta os cenários em WebP e empacota os retratos/árvores com margens e pivôs. Usa os editores nativos instalados por `npm run tools:install`. Execute `python3 desenvolvimento/renascimento/preparar.py` na raiz.
- `../../tela-inicial/renascimento/`: nova interface, animações de personagens, retratos, mapa e créditos.
- `../../jogo/renascimento/`: pinturas devastadas e integração da recuperação com os objetivos reais.

As novas ilustrações da ilha, floresta, cenários e retratos foram criadas com geração de imagens e exportadas com Inkscape/libwebp. As pinturas das fases foram editadas a partir dos cenários anteriores, preservando caminhos, pontes e edifícios para manter o alinhamento das colisões existentes. Os arquivos de arte anteriores foram preservados.

Os retratos foram ilustrados com base nas fotos fornecidas pelo usuário: Iuri Barroso Nascimento, Hicham Mohamed El Attar e Professor Peterson Lobato. As três linhas da prancha são Hicham, Iuri e Peterson, cada uma com quatro expressões. Os recortes usam a união das silhuetas para não cortar cabelo e asas durante as animações.

## Referências oficiais na página Sobre Nós

Flora tem Rowlet como inspiração; Decidueye é apresentado como sua evolução final e referência visual. Não se atribui uma inspiração pessoal específica de Kai aos estudantes sem essa informação.

As imagens de Rowlet e Decidueye são **artes oficiais de referência**, não criações do projeto: Pokémon © Nintendo / Creatures / GAME FREAK, distribuídas pelo acervo público PokeAPI:

- https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/722.png
- https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/724.png

Os PNGs originais estão em `fontes/`. As versões públicas WebP foram exportadas com `cwebp -q 94 -alpha_q 100`. A página mantém a atribuição e anima as ilustrações com movimentos discretos. O título usa a fonte Lilita já presente no projeto; as placas de madeira são SVGs próprios.

## Fluxo e persistência

Há exatamente cinco destinos jogáveis. O antigo sexto destino é migrado para a fase 5; a clareira central abre os créditos após as cinco conquistas. A restauração do mapa só é animada quando há prova da conclusão no salvamento da respectiva fase. Não há prévia da ilha recuperada para uma partida nova.

Ao concluir a quinta missão, o botão de vitória volta ao mapa para a última restauração e segue para o encerramento. O colar recebe os cinco cristais nas cores da campanha. Rever ou pausar o final não muda o progresso. A cutscene é uma celebração original, com estrutura de encerramento de livro de aventuras.

O menu carrega apenas os sprites de Kai e Flora. A prancha dos retratos é carregada ao abrir Sobre Nós. As artes do encerramento são carregadas apenas depois das cinco conquistas. Todas as referências são relativas, inclusive para GitHub Pages em subpasta.

## Validação

`npm test`, `npm run build`, `npm run check:site` e `npm run test:build`.

A validação em `tela-inicial/renascimento/validacao/renascimento.cjs` verifica ilha inteira em 320, 390, 844 e 1280 pixels; alvos de toque; restauração conquistada; bloqueio do final; colar completo; retratos piscando; falas que desaparecem; pausa, replay e movimento reduzido. As suítes anteriores continuam jogando as cinco missões, verificando colisões, áudio, controles e sprites.

### Resultado desta atualização

Build e conferência dos 12 documentos públicos aprovados. A suíte completa da produção passou, incluindo as cinco missões, colar, áudio, controles e retorno aos créditos. Após o ajuste final que recalcula uma trilha bloqueada por um animal, a primeira fase completa e os testes de Renascimento passaram novamente no build final.

As transições e as folhas foram verificadas também em desenvolvimento. As pinturas devastadas têm menos de 2% de pixels classificados como vegetação verde na amostra do teste; as cinco versões recuperadas mostram aumento visível da vegetação. Os testes verificam um raio intermediário real na máscara SVG de restauração.
