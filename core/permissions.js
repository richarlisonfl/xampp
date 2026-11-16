const { execFile } = require('node:child_process');

function runSystemCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: 15_000, maxBuffer: 512 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const detail = (stderr || stdout || error.message).trim();
        reject(new Error(detail || `Falha ao executar ${command}`));
        return;
      }

      resolve(stdout.trim());
    });
  });
}

function runSystemctl(action, service) {
  const allowedActions = new Set(['start', 'stop', 'restart', 'is-active', 'show']);
  const allowedServices = new Set(['apache2', 'mariadb']);

  if (!allowedActions.has(action) || !allowedServices.has(service)) {
    throw new Error('Operação de serviço não permitida.');
  }

  const args = action === 'show'
    ? ['show', service, '--property=ActiveState,SubState,UnitFileState', '--no-pager']
    : [action, service];

  return runSystemCommand('systemctl', args).catch((error) => {
    if (!/permission|access denied|polkit|not authorized/i.test(error.message)) throw error;
    return runSystemCommand('sudo', ['-n', 'systemctl', ...args]);
  });
}

function runJournalctl(service) {
  const args = ['-u', service, '-n', '100', '--no-pager', '--output=short-iso'];
  return runSystemCommand('journalctl', args).catch((error) => {
    if (!/permission|access denied|polkit|not authorized/i.test(error.message)) throw error;
    return runSystemCommand('sudo', ['-n', 'journalctl', ...args]);
  });
}

module.exports = { runSystemCommand, runSystemctl, runJournalctl };
