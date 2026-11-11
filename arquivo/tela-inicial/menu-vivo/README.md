# Menu vivo — folhas, acampamento e telas remodeladas

Integração nas páginas `../nova-versao/index.html`, `configuracoes.html` e `sobre.html`. O código novo está nesta pasta; o pequeno ponto de integração em `app.js` mantém o controle de preferências e delega a criação das folhas a este módulo.

## Folhas

A prancha original tem oito folhas com margens e espaçamentos diferentes; uma delas atravessa o limite de uma célula regular. `folhas.js` usa os limites reais e recortes SVG com máscaras, evitando cortar a folha ou exibir fragmentos da vizinha. A arte PNG original não foi modificada.

`folhas.css` separa a queda vertical, o balanço lateral e o giro em três elementos. Os atrasos negativos distribuem as folhas pela tela já na abertura. São 12 no celular ou 20 em telas maiores, sem acúmulo ao redimensionar. O percurso usa a altura maior do viewport quando disponível, para reduzir saltos da barra de endereço do celular. As camadas não interceptam cliques e ficam atrás do conteúdo.

As folhas de cenário e a rajada de navegação continuam independentes. **Folhas no cenário** desliga somente as primeiras. **Reduzir animações**, ou a preferência do sistema, interrompe o movimento de folhas e personagens e mantém as passagens de transparência existentes. A aba oculta pausa os keyframes.

## Kai, Flora e respostas

- Kai usa as quatro poses da prancha já recebida para os painéis de fase.
- Flora ganhou seis poses: repouso, olhos fechados, cabeça inclinada, cumprimento, asas abertas e expressão feliz. A nova prancha transparente foi gerada a partir do ícone aprovado `../../assets/identidade-flora/flora-original.png` e está em `assets/flora-poses.png`. O original gerado foi preservado fora do repositório em `/workspace/generated_images/` durante o trabalho.
- Botões de pelo menos 44 px permitem conversar por toque ou Enter/Espaço; no computador, o cursor também provoca uma reação. As falas são texto nativo em uma região de status.
- GSAP combina poses e pequenos movimentos de corpo. CSS anima a respiração; um único temporizador faz as piscadas de repouso. Novos toques substituem a reação anterior, sem acumular sequências.
- Reduzir movimento cancela imediatamente as sequências em andamento; as falas continuam funcionando. A aba oculta e `pagehide` encerram os temporizadores e as reações. `pageshow` retoma o repouso, inclusive ao voltar pelo navegador.

O fundo aprovado permanece intacto. O acampamento da tela inicial fica em um pequeno bloco separado; nas outras telas, é lateral no computador e aparece acima do painel no celular.

## Controles e aparência

Configurações reúne cartões de som e conforto, trilhas de volume preenchidas e confirmação visual das chaves. Sobre usa abas numeradas, cartões para controles de toque e a arte existente do colar completo, que responde ao toque com brilho. Botões e links têm respostas de clique e hover; elementos temporários são removidos ao fim. A preferência de texto maior continua disponível.

As interações dos personagens e do colar não alteram o progresso das fases. O mapa, as seis informações de fase e a prévia de recuperação continuam nos módulos anteriores. As fases jogáveis seguem em desenvolvimento.

## Dependência local e alternativa

GSAP 3.15.0 já era uma dependência fixada do projeto. `vendor/gsap-3.15.0.min.js` é a distribuição oficial copiada sem alterações, incluindo seu cabeçalho de autoria e licença; origem e condições estão em `vendor/ORIGEM.md`. Não é preciso baixar a biblioteca de uma CDN nem instalar outras dependências para abrir o jogo por HTTP estático. Se ela falhar, as falas e preferências continuam funcionando e os personagens usam uma resposta simples pela API de animação do navegador.

## Testar

`npm test` e `npm run test:build` incluem `validacao/menu.cjs`: queda/balanço/giro medidos, hover, toque, teclado, poses, limpeza dos cliques, controles, persistência, colar, interrupção por movimento reduzido, alternativa sem GSAP e layouts 320/390/844 px. A suíte anterior verifica as transições de navegação e as rajadas de folhas.

Os testes usam Chromium com toque emulado; não substituem verificação em aparelhos físicos. Execute as suítes após terminar as edições: o recarregamento automático do Vite pode reiniciar uma página durante uma asserção se o código for modificado enquanto os testes estão abertos.
