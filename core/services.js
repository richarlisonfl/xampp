const { runSystemctl, runSystemCommand, runJournalctl } = require('./permissions');

const SERVICE_DEFINITIONS = {
  apache: { id: 'apache', name: 'Apache', unit: 'apache2', port: 80 },
  mysql: { id: 'mysql', name: 'MariaDB', unit: 'mariadb', port: 3306 }
};

async function getPortStatus(port) {
  try {
    const output = await runSystemCommand('ss', ['-ltnH', `sport = :${port}`]);
    const listeners = output ? output.split('\n').filter(Boolean) : [];
    return { port, inUse: listeners.length > 0, listeners };
  } catch (error) {
    return { port, inUse: false, listeners: [], error: error.message };
  }
}

async function getServiceStatus(serviceId) {
  const definition = SERVICE_DEFINITIONS[serviceId];
  if (!definition) throw new Error('Serviço desconhecido.');

  let activeState = 'unknown';
  let subState = 'unknown';
  let unitFileState = 'unknown';
  let error;

  try {
    const output = await runSystemctl('show', definition.unit);
    for (const line of output.split('\n')) {
      const [key, value] = line.split('=', 2);
      if (key === 'ActiveState') activeState = value;
      if (key === 'SubState') subState = value;
      if (key === 'UnitFileState') unitFileState = value;
    }
  } catch (serviceError) {
    error = serviceError.message;
  }

  const port = await getPortStatus(definition.port);
  return {
    id: definition.id,
    name: definition.name,
    unit: definition.unit,
    active: activeState === 'active',
    state: activeState,
    subState,
    enabled: unitFileState === 'enabled',
    port,
    error
  };
}

async function getAllStatuses() {
  const statuses = await Promise.all(
    Object.keys(SERVICE_DEFINITIONS).map((service) => getServiceStatus(service))
  );
  return Object.fromEntries(statuses.map((status) => [status.id, status]));
}

async function operateService(serviceId, action) {
  const definition = SERVICE_DEFINITIONS[serviceId];
  if (!definition) throw new Error('Serviço desconhecido.');
  await runSystemctl(action, definition.unit);
  return getServiceStatus(serviceId);
}

async function operateAll(action) {
  const results = {};
  for (const serviceId of Object.keys(SERVICE_DEFINITIONS)) {
    results[serviceId] = await operateService(serviceId, action);
  }
  return results;
}

async function getServiceLogs(serviceId) {
  const definition = SERVICE_DEFINITIONS[serviceId];
  if (!definition) throw new Error('Serviço desconhecido.');
  return runJournalctl(definition.unit);
}

module.exports = {
  SERVICE_DEFINITIONS,
  getServiceStatus,
  getAllStatuses,
  operateService,
  operateAll,
  getServiceLogs
};
