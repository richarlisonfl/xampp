# Meu XAMPP para Debian

Gerenciador local de ambiente PHP com Node.js, Express, systemd e Electron.

## Requisitos

- Debian com Node.js 20 ou superior e npm.
- `systemctl` e `ss`.
- Apache (`apache2`) e MariaDB (`mariadb`) são detectados pelo systemd.
- PHP é opcional para o painel, mas necessário para executar projetos PHP.

## Instalação

```bash
chmod +x install.sh
npm run install-system
```

O instalador cria os diretórios, instala as dependências, registra o aplicativo no menu e oferece uma regra sudoers limitada somente às operações fixas de Apache, MariaDB e logs. O Node.js continua sendo executado como usuário comum.

## Inicialização

```bash
npm start       # painel web em http://127.0.0.1:8080
npm run desktop # aplicativo Electron
```

O backend escuta apenas em `127.0.0.1`. O Electron reutiliza o backend existente e inicia um processo somente quando necessário.

## Painel

O painel mostra o estado real consultado do systemd, portas 80/3306, logs recentes, controles individuais e controles gerais. A seção **MEUS PROJETOS** usa `~/xampp/www` por padrão (ou `XAMPP_WWW`) e rejeita nomes com separadores de caminho ou caracteres não permitidos.

## API

Os endpoints de serviços, logs, projetos e sistema estão disponíveis sob `/api`. Todas as respostas usam `{ success, message, data }` quando aplicável. Nenhum comando é aceito como entrada do navegador.

## Resolução de problemas

- **Permissão negada:** execute novamente `npm run install-system` e aceite a regra sudoers, ou configure manualmente permissões equivalentes para os comandos fixos.
- **Serviço não encontrado:** confirme `systemctl status apache2` ou `systemctl status mariadb`.
- **Porta ocupada:** use `ss -ltnp | grep -E ':80|:3306'` e ajuste o serviço conflitante.
- **Electron não abre:** execute `npm install` e confirme que sua sessão gráfica fornece `DISPLAY`/Wayland.

## Desinstalação

Remova o lançador (`~/.local/share/applications/meu-xampp.desktop`), a regra opcional (`/etc/sudoers.d/meu-xampp`, com `sudo`) e a pasta do projeto. O instalador não remove Apache, MariaDB, PHP ou Node.js do sistema.
