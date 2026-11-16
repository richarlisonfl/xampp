const { startServer } = require('./backend/server');

startServer().catch((error) => {
  console.error(`Não foi possível iniciar o servidor: ${error.message}`);
  process.exitCode = 1;
});
