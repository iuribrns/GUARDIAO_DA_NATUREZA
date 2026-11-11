# Encanto natural: painéis, Flora e som

Esta revisão segue as duas referências enviadas em 04/11/2026. As pastas anteriores foram preservadas.

- Placas verdes com madeira pintada e folhas no mapa de tela inteira; o estado de cada região continua dependendo do progresso real.
- Seleção horizontal com título sobre as duas colunas, Kai e o aliado, situação, objetivos reais, equipamentos ilustrados e cristal da cor da região. Só há Voltar e Iniciar no rodapé; não existe prévia de restauração nem duração estimada.
- Pergaminho e madeira nas conversas curtas da fase. Os dois botões principais, a pausa e o bloqueio em orientação retrato foram mantidos.
- Flora foi remodelada em 16 poses completas: oito de voo, quatro de pouso, repouso, piscada e duas de comemoração. A mesma prancha atende ao mapa, às cinco fases e ao epílogo. Pausa e configurações usam o retrato do mesmo modelo. A composição existente de Kai e Flora no horizonte foi preservada.
- **Uma única música nova**, “Caminhos da Floresta”, acompanha menu, mapa, cinco fases e epílogo. Flauta, violão de nylon, harpa e cordas leves substituem o catálogo de músicas por fase. A posição é compartilhada entre telas; os arquivos antigos continuam arquivados.
- Os 12 efeitos também foram substituídos: madeira, passos, água, coleta, plantio, resgate, equipamentos e conclusão. A mangueira tem junção contínua e cancelamento ao soltar/pausar.

## Arquivos e reprodução

Código e arte pública: `jogo/encanto-natural/`. Originais e ferramentas de autoria: esta pasta. Apenas as entradas HTML existentes e os validadores apontam para a revisão nova.

```sh
python3 desenvolvimento/encanto-natural/preparar.py
python3 desenvolvimento/encanto-natural/compor.py
npm run build
npm run check:site
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/encanto-natural/validacao/interface.cjs
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/encanto-natural/validacao/flora.cjs
GUARDIAO_TEST_URL=http://127.0.0.1:4173/tela-inicial/nova-versao/ node jogo/encanto-natural/validacao/audio.cjs
GUARDIAO_CAPTURE_URL=http://127.0.0.1:4173/ node desenvolvimento/encanto-natural/capturar.cjs /tmp/guardiao-encanto
```

O preview deve estar iniciado com `npm run preview`. A autoria usa NumPy, SciPy, Pillow para medir silhuetas, Inkscape para composição/recorte e cwebp para exportação. Nenhuma prancha é pintada ou recortada por processamento de pixels. Imagens originais foram geradas para este projeto e ficam em `fontes/`.

O áudio usa libfluidsynth, o banco TimGM6mb instalado em `/usr/share/sounds/sf2/TimGM6mb.sf2` e FFmpeg. Não exige esses programas no celular. A música tem melodia e arranjo originais, 82 BPM e 48 compassos (2min20s), com cauda de reverberação incorporada ao loop. O MP3 estéreo de 96 kbps tem aproximadamente 1,69 MB. O manifesto registra duração, pico e RMS de todos os arquivos.

Instrumentos TimGM6mb: Tim Brechbill (2004) e David Bolton (2010), GPL-2. A procedência e o texto da licença estão em `fontes/TimGM6mb-autoria.txt` e `fontes/GPL-2.txt`; o banco não foi redistribuído neste repositório. Biblioteca de renderização: FluidSynth. Não foram usadas músicas comerciais nem amostras externas nos efeitos.

A música permanece sujeita à ativação por toque/clique exigida pelo navegador. Os controles de música e efeitos mantêm as preferências já salvas. As molduras usam imagens WebP com texto HTML, foco de teclado e área de informações rolável nas telas menores ou com fonte ampliada; Voltar e Iniciar permanecem visíveis.
