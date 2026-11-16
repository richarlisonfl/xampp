const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

const PROJECTS_ROOT = path.resolve(process.env.XAMPP_WWW || path.join(os.homedir(), 'xampp', 'www'));

function safeProjectPath(name) {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(name) || name === '.' || name === '..') {
    throw new Error('Nome de projeto inválido.');
  }
  const projectPath = path.resolve(PROJECTS_ROOT, name);
  if (projectPath !== PROJECTS_ROOT && !projectPath.startsWith(`${PROJECTS_ROOT}${path.sep}`)) {
    throw new Error('Caminho de projeto não permitido.');
  }
  return projectPath;
}

async function listProjects() {
  await fs.mkdir(PROJECTS_ROOT, { recursive: true });
  const entries = await fs.readdir(PROJECTS_ROOT, { withFileTypes: true });
  return Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
    const projectPath = safeProjectPath(entry.name);
    const files = await fs.readdir(projectPath);
    return {
      name: entry.name,
      path: projectPath,
      isPhp: files.some((file) => file.endsWith('.php')),
      hasIndex: files.includes('index.php')
    };
  }));
}

function createProjectRoutes() {
  const router = express.Router();
  router.get('/', async (_request, response) => {
    try {
      response.json({ success: true, message: 'Projetos consultados.', data: { root: PROJECTS_ROOT, projects: await listProjects() } });
    } catch (error) {
      response.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/', async (request, response) => {
    try {
      const { name, createIndex = false } = request.body || {};
      const projectPath = safeProjectPath(name);
      await fs.mkdir(projectPath, { recursive: false });
      if (createIndex === true) {
        await fs.writeFile(path.join(projectPath, 'index.php'), '<?php\n\necho \"Meu projeto PHP\";\n', { flag: 'wx' });
      }
      response.status(201).json({ success: true, message: 'Projeto criado.', data: { name, path: projectPath, hasIndex: createIndex === true } });
    } catch (error) {
      const status = error.code === 'EEXIST' ? 409 : 400;
      response.status(status).json({ success: false, message: error.message });
    }
  });
  return router;
}

module.exports = { createProjectRoutes, PROJECTS_ROOT };
