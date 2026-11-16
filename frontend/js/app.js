const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function showError(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 4500);
}

async function api(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.message || 'Operação não realizada.');
  return body.data;
}

function renderStatus(statuses) {
  const values = Object.values(statuses);
  const active = values.filter((status) => status.active).length;
  $('#overall-status').textContent = `${active}/${values.length} serviços ativos`;
  $('#overall-message').textContent = active === values.length ? 'Seu ambiente está pronto.' : 'Alguns serviços precisam de atenção.';
  $('#last-update').textContent = `Atualizado às ${new Date().toLocaleTimeString()}`;
  for (const status of values) {
    const card = $(`[data-service="${status.id}"]`);
    const stateNames = { active: 'Funcionando', inactive: 'Parado', failed: 'Com erro', activating: 'Iniciando', deactivating: 'Parando', unknown: 'Indisponível' };
    $('.service-state', card).textContent = status.error || (status.active ? 'Funcionando' : `${stateNames[status.state] || 'Estado desconhecido'} (${status.state})`);
    $('.service-port', card).textContent = `Porta ${status.port.port}${status.port.inUse ? ' em uso' : ' livre'}`;
    $('.status-dot', card).className = `status-dot ${status.active ? 'active' : status.error ? 'error' : ''}`;
  }
}

async function refresh() {
  try { renderStatus(await api('/api/status')); } catch (error) { showError(error.message); }
}

async function loadLogs(service) {
  try { $(`.logs`, $(`[data-service="${service}"]`)).textContent = await api(`/api/logs/${service}`); } catch (error) { $(`.logs`, $(`[data-service="${service}"]`)).textContent = error.message; }
}

async function operate(url, button) {
  button.disabled = true;
  try { await api(url, { method: 'POST' }); await refresh(); } catch (error) { showError(error.message); } finally { button.disabled = false; }
}

async function loadProjects() {
  try {
    const { root, projects } = await api('/api/projects');
    $('#projects-root').textContent = root;
    $('#projects').innerHTML = projects.length ? projects.map((project) => `<div class="project"><div><strong>${project.name}</strong><small>${project.path}${project.isPhp ? ' · PHP' : ''}</small></div><a class="button secondary" href="/projects/${encodeURIComponent(project.name)}" target="_blank" rel="noopener">Abrir</a></div>`).join('') : '<p class="muted">Nenhum projeto criado.</p>';
  } catch (error) { showError(error.message); }
}

async function createProject() {
  const name = window.prompt('Nome do novo projeto:');
  if (!name) return;
  const createIndex = window.confirm('Criar index.php automaticamente?');
  try { await api('/api/projects', { method: 'POST', body: JSON.stringify({ name, createIndex }) }); await loadProjects(); } catch (error) { showError(error.message); }
}

async function loadSystemInfo() {
  try {
    const system = await api('/api/system');
    const phpMyAdmin = system.phpMyAdmin.installed ? `<a href="${system.phpMyAdmin.url}" target="_blank" rel="noopener">Abrir</a>` : 'Não instalado';
    $('#system-info').innerHTML = `<div class="tool"><strong>PHP</strong><span>${system.php ? 'Instalado' : 'Não encontrado'}</span></div><div class="tool"><strong>Node.js</strong><span>${system.node ? 'Instalado' : 'Não encontrado'}</span></div><div class="tool"><strong>phpMyAdmin</strong><span>${phpMyAdmin}</span></div><div class="tool"><strong>Localhost</strong><a href="/projects/" target="_blank" rel="noopener">Abrir projetos</a></div><div class="tool"><strong>Apache</strong><span>${system.configs.apache}</span></div><div class="tool"><strong>MariaDB</strong><span>${system.configs.mariadb}</span></div>`;
  } catch (error) { showError(error.message); }
}

$$('[data-all-action]').forEach((button) => button.addEventListener('click', () => operate(`/api/services/${button.dataset.allAction}-all`, button)));
$$('[data-action]').forEach((button) => button.addEventListener('click', () => {
  const service = button.closest('[data-service]').dataset.service;
  operate(`/api/${service}/${button.dataset.action}`, button).then(() => loadLogs(service));
}));
$('#new-project').addEventListener('click', createProject);
refresh(); loadProjects(); loadSystemInfo(); loadLogs('apache'); loadLogs('mysql');
setInterval(refresh, 10000); setInterval(() => { loadLogs('apache'); loadLogs('mysql'); }, 15000);
