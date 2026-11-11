# Sons da Natureza

Seis composições instrumentais originais, com teclas macias, acordes estendidos, baixo leve, pequenas melodias e batidas lentas. Não há vozes, anúncios, serviços externos nem amostras de músicas comerciais.

| Tela/região | Trilha | Andamento |
| --- | --- | --- |
| Início, mapa, configurações e sobre | Brisa de boas-vindas | 70 BPM |
| Floresta em Chamas | Clareira tranquila | 72 BPM |
| Rio Poluído | Águas de cristal | 68 BPM |
| Resgate da Fauna | Amigos da mata | 74 BPM |
| Reflorestamento | Sementes ao sol | 66 BPM |
| Cidade Sustentável | Um amanhã mais verde | 76 BPM |

As músicas duram entre 1min40s e 1min56s e repetem automaticamente. Apenas a trilha da tela atual é solicitada, depois da liberação de áudio do navegador. O MP3 estéreo de cada faixa ocupa cerca de 1,2–1,4 MB e pode começar a tocar sem baixar todas as músicas. A posição da trilha do menu é guardada durante a navegação na mesma aba.

Os efeitos melódicos acompanham a tonalidade da trilha de cada região. Há 12 efeitos: toque de madeira, recebimento de itens, água liberada, fluxo da mangueira, restauração, resgate, coleta, tentativa de puzzle, vitória, passos, natação e plantio. A mangueira usa um ruído de água contínuo, em vez dos apitos repetidos. Ela para ao soltar o controle, pausar ou esconder a aba. Efeitos atrasados e repetidos são limitados para evitar acúmulo de sons.

## Preferências

**Música do jogo**, **Volume da música**, **Efeitos sonoros** e **Volume dos efeitos** usam as opções existentes do navegador. Música e efeitos têm volumes independentes. Perfis novos começam com música habilitada em 40%; opções anteriores, inclusive música desativada, são preservadas. O botão de som nas fases continua controlando os efeitos e salva sua escolha.

O primeiro toque/clique ou uma tecla libera o áudio conforme a política do navegador. Ao mudar de tela, o sistema tenta continuar a música usando essa liberação e a posição salvas na aba; se o navegador exigir outra interação, a próxima interação tenta novamente. Música e efeitos param ao esconder a aba. Falas, inventário e pausa deixam a trilha mais baixa. O teste de som é uma prévia explícita e não muda a opção de efeitos salva.

`audio.js` compartilha um único AudioContext por página. A música usa reprodução progressiva e os efeitos curtos usam buffers em cache. Há transições suaves de volume, proteção contra picos, descarte de sons pendentes depois da interrupção e limites de vozes. Falhas de áudio não bloqueiam o jogo.

`assets/manifesto.json` registra a duração, o pico, o RMS e o tamanho de cada arquivo. As composições e os efeitos foram sintetizados do zero pelo script `desenvolvimento/trilha-sonora/compor.py`. Os arquivos anteriores do projeto foram preservados.
