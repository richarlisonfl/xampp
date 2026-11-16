const express = require('express');
const os = require('node:os');
const { runSystemCommand } = require('../../core/permissions');

async function commandVersion(command, args) {
  try {
    return await runSystemCommand(command, args);
  } catch {
    return null;
  }
}

async function detectPhpMyAdmin() {
  const locations = ['/usr/share/phpmyadmin', '/var/www/html/phpmyadmin'];
  for (const location of locations) {
    try {
      await require('node:fs/promises').access(location);
      return { installed: true, url: 'http://localhost/phpmyadmin' };
    } catch {}
  }
  return { installed: false, url: null };
}

function createSystemRoutes() {
  const router = express.Router();
  router.get('/', async (_request, response) => {
    const [php, node, phpMyAdmin] = await Promise.all([
      commandVersion('php', ['-v']),
      commandVersion(process.execPath, ['--version']),
      detectPhpMyAdmin()
    ]);
    response.json({
      success: true,
      message: 'Informações do sistema consultadas.',
      data: {
        platform: `${process.platform} ${os.release()}`,
        hostname: os.hostname(),
        php,
        node,
        phpMyAdmin,
        configs: {
          apache: '/etc/apache2',
          mariadb: '/etc/mysql/mariadb.conf.d'
        }
      }
    });
  });
  return router;
}

module.exports = { createSystemRoutes };
