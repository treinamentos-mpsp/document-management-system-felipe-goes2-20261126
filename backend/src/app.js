const express = require('express');
const multer = require('multer');
const documentRoutes = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: status === 413 ? 'Arquivo excede o tamanho máximo.' : 'Upload inválido.' });
  }
  if (error.status === 400 || error.status === 413) {
    return res.status(error.status).json({ error: error.status === 413 ? 'Requisição excede o tamanho máximo.' : 'Requisição inválida.' });
  }
  return res.status(500).json({ error: 'Não foi possível processar a requisição.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
