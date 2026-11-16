const services = require('./services');

module.exports = {
  getStatus: () => services.getServiceStatus('mysql'),
  start: () => services.operateService('mysql', 'start'),
  stop: () => services.operateService('mysql', 'stop'),
  restart: () => services.operateService('mysql', 'restart'),
  getLogs: () => services.getServiceLogs('mysql')
};
