// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const storageDirectory = path.join(__dirname, '../storage');
const documents = new Map();
const upload = multer({
  storage: multer.diskStorage({
    destination: storageDirectory,
    filename: (req, file, callback) => callback(null, randomUUID()),
  }),
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'É necessário enviar um arquivo.' });
  }

  const document = {
    id: randomUUID(),
    name: req.file.originalname,
    size: req.file.size,
    uploadedAt: new Date().toISOString(),
    filename: req.file.filename,
  };
  documents.set(document.id, document);

  const { filename, ...metadata } = document;
  return res.status(201).json(metadata);
});

app.get('/documents', (req, res) => {
  const result = Array.from(documents.values(), ({ filename, ...metadata }) => metadata);
  res.json(result);
});

app.get('/documents/:id/download', (req, res) => {
  const document = documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  return res.download(path.join(storageDirectory, document.filename), document.name);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
