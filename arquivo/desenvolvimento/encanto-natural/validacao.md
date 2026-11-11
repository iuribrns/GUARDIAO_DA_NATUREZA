# Verificações desta revisão

Ambiente: Node.js 24, Chromium instalado no ambiente e Playwright. Celulares foram emulados em orientação paisagem; não se trata de teste em aparelhos físicos. Os testes da campanha percorrem objetivos reais com teclado ou ponteiro e concluem as fases.

- `npm run build` e `npm run check:site`: entradas, recursos WebP/MP3, 16 poses da Flora, uma música única, doze efeitos e arquivos anteriores preservados.
- `jogo/encanto-natural/validacao/interface.cjs`: 844×390, 667×375, 740×320, 932×430 com texto ampliado e 1024×768. Seis destinos, dois botões no painel, itens/recompensa legíveis em 844×390, diálogos, pausa, mochila, rotação, retorno e créditos. Fonte ampliada e telas mais baixas mantêm rolagem nas informações com o rodapé fixo.
- `jogo/interface-viva/validacao/campanha.cjs`: campanha inteira no computador e em celular emulado. Fase 1: registro, oito focos e três resgates. Fases 2–5: atividades, trajes, itens e conquistas reais. Epílogo com seis cenas.
- `jogo/encanto-natural/validacao/flora.cjs`: os 16 recortes têm arte, margens e nenhuma parte de outro quadro; voo, repouso, piscada, movimento reduzido, dica que desaparece e retrato de configurações.
- `jogo/encanto-natural/validacao/audio.cjs`: MP3 tocando com sinal real, uma URL de música em todas as fases, posição conservada entre regiões, doze efeitos decodificados, volumes separados, preferências, gesto inicial, pausa/aba oculta, mangueira contínua, cancelamento antes da decodificação, toque, armazenamento bloqueado e falha de música sem bloquear a interface.
- `tela-inicial/horizonte-vivo/validacao/horizonte.cjs`: início preservado, rostos e fogo animados, mapa ocupando a tela inteira, seis placas separadas e alcançáveis, conclusão somente após os cinco cristais e celebração.
- `tela-inicial/equipe-retratos/validacao/professor.cjs`: somente Professor Peterson no perfil, navegação, nomes contidos, rotação, GSAP e alternativa sem biblioteca.
- Inspeção adicional do mapa novo em 740×320 e 667×375: centros dos seis botões recebem o toque correto e as placas bloqueadas/liberadas não se sobrepõem. A mesma geometria é utilizada para ambos os estados.
- Capturas de mapa inicial/restaurado, seis painéis, cinco conversas, fases, pausa e mochila; galeria com as 16 poses de Flora.

Música: “Caminhos da Floresta”, original, 140,488 s, 82 BPM. FFmpeg mediu aproximadamente −19,3 LUFS integrados e pico verdadeiro −6,4 dBFS. O volume padrão da música é 40% e é reduzido durante os diálogos. O jato de água usa junção com sobreposição e envelopes ao iniciar/parar.

As seis músicas antigas e as artes anteriores continuam no repositório como arquivo; as entradas atuais carregam somente a música nova. O script de autoria e a procedência dos instrumentos estão nesta pasta.
