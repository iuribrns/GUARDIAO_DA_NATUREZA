"""Executa o editor com configuração gravável e display virtual só quando necessário."""
import os
from pathlib import Path
import select
import subprocess
import sys

root = Path(__file__).resolve().parents[0] if Path(__file__).parent.name == 'runtime' else Path(os.environ.get('GUARDIAO_TOOLS_DIR', '/workspace/.tools/guardiao'))
if root.name == 'runtime':
    root = root.parent
name, executable, *arguments = sys.argv[1:]
env = os.environ.copy()
for key, folder in [('XDG_CONFIG_HOME', 'config'), ('XDG_CACHE_HOME', 'cache'), ('XDG_DATA_HOME', 'data')]:
    path = root / folder
    path.mkdir(parents=True, exist_ok=True)
    env[key] = str(path)
display = None
try:
    if not env.get('DISPLAY') and not env.get('WAYLAND_DISPLAY'):
        if name == 'tiled':
            xvfb = root / 'native/usr/bin/Xvfb'
            if not xvfb.exists():
                raise SystemExit('Xvfb indisponível. Execute npm run tools:install para preparar o Tiled sem monitor.')
            display = subprocess.Popen([str(xvfb), '-displayfd', '1', '-screen', '0', '1024x768x24', '-nolisten', 'tcp'], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
            if not select.select([display.stdout], [], [], 10)[0]:
                raise SystemExit('O display virtual não iniciou.')
            number = display.stdout.readline().strip()
            if not number.isdigit():
                raise SystemExit('O display virtual não informou um número válido.')
            env['DISPLAY'] = ':' + number
            env.pop('QT_QPA_PLATFORM', None)
        else:
            env['SDL_VIDEODRIVER'] = 'dummy'
    raise SystemExit(subprocess.run([executable, *arguments], env=env).returncode)
finally:
    if display:
        display.terminate()
        try:
            display.wait(timeout=5)
        except subprocess.TimeoutExpired:
            display.kill()
            display.wait()
