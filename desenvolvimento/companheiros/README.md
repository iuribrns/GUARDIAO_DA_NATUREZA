# Painéis do kit Kai e Flora

Os dois ZIPs enviados tinham o mesmo conteúdo. As três camadas — floresta,
dupla e moldura — compõem os painéis de Sobre o jogo e Configurações, cada um
com sua legenda em HTML. A imagem completa não é publicada.

As imagens mantêm dimensões e transparência. A conversão para WebP, qualidade
88, reduziu o conjunto de 6.417.580 para 932.834 bytes (85,5%). Elas carregam
quando o painel fica visível e são compartilhadas pelas duas seções.

`jogo/companheiros/painel.css` conserva a proporção 2:3 da moldura e encaixa os
textos na área verde. A floresta preenche a janela; os personagens usam
`object-fit: contain`, sem cortar asas ou pés. O movimento leve usa apenas
uma translação, desativada com menos movimento ou gráficos leves.

Nas configurações, a ilustração ocupa a coluna ao lado do cabeçalho, abas e
rodapé, aproveitando a altura da janela. Em telas baixas, legendas auxiliares
cedem espaço ao título e ao resumo dos ajustes. Os controles continuam nas
suas abas e a rolagem fica no conteúdo.

Os dois canvases antigos saíram do ciclo de desenho do menu. Os arquivos
anteriores permanecem no repositório; a antiga prévia do galho deixou de ser
carregada. As artes da demonstração de comandos e do professor carregam ao
abrir suas abas.
