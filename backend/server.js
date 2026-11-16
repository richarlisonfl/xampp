const express = require('express');
const path = require('node:path');
const { createApiRouter } = require('./routes');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 8080);

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', createApiRouter());
  app.use('/projects', express.static(path.join(__dirname, '..', 'www')));
  app.use(express.static(path.join(__dirname, '..', 'frontend')));
  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  });
  return app;
}

function startServer() {
  const app = createApp();
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, HOST, () => {
      console.log(`Meu XAMPP disponível em http://${HOST}:${PORT}`);
      resolve(server);
    });
    server.once('error', reject);
  });
}

module.exports = { HOST, PORT, createApp, startServer };
