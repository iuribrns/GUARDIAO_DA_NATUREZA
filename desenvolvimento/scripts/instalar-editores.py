"""Instala editores oficiais, com SHA-256 publicado pelo GitHub e sem sudo."""
import hashlib
import json
import os
from pathlib import Path
import platform
import shlex
import shutil
import subprocess
import sys
import tempfile
import urllib.request

REPO = Path(__file__).resolve().parents[2]
TOOLS = Path(os.environ.get('GUARDIAO_TOOLS_DIR', '/workspace/.tools/guardiao' if Path('/workspace').is_dir() else str(REPO / '.cache/editores')))


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_virtual_display():
    """Apenas baixa/extrai o Xvfb; usa índices APT assinados e não altera o sistema."""
    if os.environ.get('DISPLAY') or os.environ.get('WAYLAND_DISPLAY') or (TOOLS / 'native/usr/bin/Xvfb').exists():
        return
    if platform.freedesktop_os_release().get('VERSION_CODENAME') != 'trixie':
        raise SystemExit('Para o Tiled sem monitor, instale Xvfb pelo gerenciador do seu Linux. O instalador automático da nuvem usa Debian 13.')
    root = TOOLS / 'apt'
    for folder in ['lists/partial', 'cache/archives/partial', 'logs', 'empty']:
        (root / folder).mkdir(parents=True, exist_ok=True)
    keyring = '/usr/share/keyrings/debian-archive-keyring.gpg'
    (root / 'sources.list').write_text(
        f'deb [signed-by={keyring}] https://deb.debian.org/debian trixie main\n'
        f'deb [signed-by={keyring}] https://security.debian.org/debian-security trixie-security main\n')
    conf = root / 'apt.conf'
    conf.write_text(f'''Dir::Etc::main "/dev/null";
Dir::Etc::parts "{root}/empty";
Dir::Etc::sourcelist "{root}/sources.list";
Dir::Etc::sourceparts "{root}/empty";
Dir::State::lists "{root}/lists";
Dir::State::status "/var/lib/dpkg/status";
Dir::Cache "{root}/cache";
Dir::Log "{root}/logs";
''')
    environment = {**os.environ, 'APT_CONFIG': str(conf)}
    subprocess.run(['/usr/bin/apt-get', 'update'], env=environment, cwd=root, check=True)
    subprocess.run(['/usr/bin/apt-get', 'download', 'xvfb'], env=environment, cwd=root, check=True)
    for archive in root.glob('xvfb_*.deb'):
        subprocess.run(['dpkg-deb', '-x', str(archive), str(TOOLS / 'native')], check=True)


def install():
    if platform.system() != 'Linux' or platform.machine() not in ('x86_64', 'AMD64'):
        raise SystemExit('Este instalador é para Linux x86_64. Consulte desenvolvimento/README.md para instalar os editores no seu computador.')
    manifest = json.loads((REPO / 'desenvolvimento/editores.json').read_text())
    (TOOLS / 'downloads').mkdir(parents=True, exist_ok=True)
    (TOOLS / 'bin').mkdir(exist_ok=True)
    (TOOLS / 'runtime').mkdir(exist_ok=True)
    shutil.copy2(REPO / 'desenvolvimento/scripts/executar-editor.py', TOOLS / 'runtime/executar-editor.py')
    ensure_virtual_display()
    failures = []
    for name, package in manifest.items():
        archive = TOOLS / 'downloads' / (name + '-' + package['version'] + '.AppImage')
        if not archive.exists() or sha256(archive) != package['sha256']:
            partial = archive.with_suffix('.part')
            print('Baixando', name, package['version'], flush=True)
            request = urllib.request.Request(package['url'], headers={'User-Agent': 'Guardiao-development-setup'})
            with urllib.request.urlopen(request, timeout=60) as source, partial.open('wb') as target:
                shutil.copyfileobj(source, target)
            if sha256(partial) != package['sha256']:
                partial.unlink()
                raise SystemExit('SHA-256 inválido para ' + name + '; o arquivo não será executado.')
            partial.replace(archive)
        archive.chmod(0o755)
        destination = TOOLS / (name + '-' + package['version'])
        if not (destination / 'AppRun').exists():
            with tempfile.TemporaryDirectory(prefix=name + '-', dir=TOOLS) as temporary:
                log = Path(temporary) / 'extracao.log'
                with log.open('wb') as output:
                    subprocess.run([str(archive), '--appimage-extract'], cwd=temporary, stdout=output, stderr=subprocess.STDOUT, check=True)
                extracted = Path(temporary) / 'squashfs-root'
                if destination.exists():
                    raise SystemExit('Diretório incompleto já existe: ' + str(destination))
                extracted.rename(destination)
        wrapper = TOOLS / 'bin' / name
        wrapper.write_text('#!/bin/sh\nset -eu\nexec ' + shlex.join([sys.executable, str(TOOLS / 'runtime/executar-editor.py'), name, str(destination / 'AppRun')]) + ' \"$@\"\n')
        wrapper.chmod(0o755)
        result = subprocess.run([str(wrapper), '--version'], text=True, capture_output=True)
        if result.returncode:
            failures.append(name + ' não iniciou:\n' + result.stdout + result.stderr)
            continue
        print(name + ': ' + result.stdout.strip() + ' — SHA-256 verificado', flush=True)
    if failures:
        raise SystemExit('\n'.join(failures))
    print('Editores disponíveis em ' + str(TOOLS / 'bin'))


if __name__ == '__main__':
    install()
