const services = require('./services');

module.exports = {
  getStatus: () => services.getServiceStatus('apache'),
  start: () => services.operateService('apache', 'start'),
  stop: () => services.operateService('apache', 'stop'),
  restart: () => services.operateService('apache', 'restart'),
  getLogs: () => services.getServiceLogs('apache')
};
