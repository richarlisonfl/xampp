#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
command -v node >/dev/null || { echo "Node.js 20+ é obrigatório."; exit 1; }
node -e 'if (Number(process.versions.node.split(".")[0]) < 20) process.exit(1)' || { echo "Node.js 20+ é obrigatório."; exit 1; }

for command in systemctl ss; do
  command -v "$command" >/dev/null || { echo "Dependência ausente: $command"; exit 1; }
done

mkdir -p "$ROOT"/{config,logs,www}
npm install

if command -v sudo >/dev/null && [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "Para controlar Apache/MariaDB sem executar o Node como root, configure permissões restritas."
  read -r -p "Instalar regra sudoers limitada para este projeto? [y/N] " answer
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    sudo install -m 0440 /dev/stdin /etc/sudoers.d/meu-xampp <<EOF
${USER} ALL=(root) NOPASSWD: /usr/bin/systemctl start apache2, /usr/bin/systemctl stop apache2, /usr/bin/systemctl restart apache2, /usr/bin/systemctl show apache2 --property=ActiveState,SubState,UnitFileState --no-pager, /usr/bin/systemctl start mariadb, /usr/bin/systemctl stop mariadb, /usr/bin/systemctl restart mariadb, /usr/bin/systemctl show mariadb --property=ActiveState,SubState,UnitFileState --no-pager, /usr/bin/journalctl -u apache2 -n 100 --no-pager --output=short-iso, /usr/bin/journalctl -u mariadb -n 100 --no-pager --output=short-iso
EOF
    sudo visudo -cf /etc/sudoers.d/meu-xampp
  fi
fi

launcher="$HOME/.local/share/applications/meu-xampp.desktop"
install -Dm644 "$ROOT/desktop/xampp.desktop" "$launcher"
desktop_dir="${XDG_DESKTOP_DIR:-$HOME/Desktop}"
if command -v xdg-user-dir >/dev/null 2>&1; then
  desktop_dir="$(xdg-user-dir DESKTOP)"
fi
mkdir -p "$desktop_dir"
install -Dm755 "$ROOT/desktop/xampp.desktop" "$desktop_dir/meu-xampp.desktop"
echo "Instalação concluída. Execute: npm start ou npm run desktop"
