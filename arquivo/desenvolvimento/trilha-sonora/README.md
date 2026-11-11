# Composição original de música e efeitos

`compor.py` produz as seis trilhas e os 12 efeitos de `jogo/sons-da-natureza/assets`. A síntese é original e não usa gravações, samples, vozes ou músicas externas.

As trilhas têm 32 compassos com acordes de sétima/nona, pequenas melodias próprias, teclas elétricas suaves, cordas dedilhadas ou sopro, baixo, bumbo leve, caixa escovada e chimbal discreto. Andamentos de 66–76 BPM, pequenas variações de tempo/volume, caudas de reverberação e uma camada muito baixa de ar dão o caráter lo-fi. Cada região tem tonalidade, instrumento e arranjo próprios, mantendo um tema comum. O programa usa sementes fixas para permitir a reprodução.

O sintetizador limita graves excessivos e agudos ásperos, ajusta o RMS, preserva margem de pico e aplica uma curta suavização nas bordas. Os arquivos finais são MP3 estéreo (96 kbps para música e 64 kbps para efeitos). O áudio é gerado a 24 kHz e codificado a 44,1 kHz pelo FFmpeg. A duração e as medições antes da codificação ficam no manifesto. No arquivo MP3 do menu, a medição EBU R128 resultou em aproximadamente -20,7 LUFS e pico verdadeiro de -5,1 dBFS; os volumes do jogo atenuam esse sinal.

Para reproduzir, use Python com NumPy e SciPy, além do FFmpeg com `libmp3lame`:

```sh
python3 desenvolvimento/trilha-sonora/compor.py
```

O projeto já utiliza NumPy/SciPy na autoria de arte; suas versões estão em `desenvolvimento/recortes/requirements.txt`. A reprodução do jogo exige apenas o navegador, sem Python ou FFmpeg.
