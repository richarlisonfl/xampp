const express = require('express');
const apache = require('../core/apache');
const mysql = require('../core/mysql');
const services = require('../core/services');
const { createProjectRoutes } = require('./routes/projects');
const { createSystemRoutes } = require('./routes/system');

function responseData(response, data, message = 'OK') {
  response.json({ success: true, message, data });
}

function responseError(response, error) {
  const message = error.message || 'Operação não realizada.';
  const status = /desconhecido|inválid|permitid|obrigatór/i.test(message) ? 400 : 500;
  response.status(status).json({ success: false, message });
}

function createApiRouter() {
  const router = express.Router();
  const action = (operation, message) => async (request, response) => {
    try {
      responseData(response, await operation(), message);
    } catch (error) {
      responseError(response, error);
    }
  };

  router.get('/status', action(services.getAllStatuses, 'Status consultado.'));
  router.post('/apache/start', action(apache.start, 'Apache iniciado.'));
  router.post('/apache/stop', action(apache.stop, 'Apache parado.'));
  router.post('/apache/restart', action(apache.restart, 'Apache reiniciado.'));
  router.post('/mysql/start', action(mysql.start, 'MariaDB iniciado.'));
  router.post('/mysql/stop', action(mysql.stop, 'MariaDB parado.'));
  router.post('/mysql/restart', action(mysql.restart, 'MariaDB reiniciado.'));
  router.post('/services/start-all', action(() => services.operateAll('start'), 'Serviços iniciados.'));
  router.post('/services/stop-all', action(() => services.operateAll('stop'), 'Serviços parados.'));
  router.post('/services/restart-all', action(() => services.operateAll('restart'), 'Serviços reiniciados.'));

  for (const [serviceId, service] of Object.entries({ apache, mysql })) {
    router.get(`/logs/${serviceId}`, action(service.getLogs, 'Logs consultados.'));
  }

  router.use('/projects', createProjectRoutes());
  router.use('/system', createSystemRoutes());
  return router;
}

module.exports = { createApiRouter };
