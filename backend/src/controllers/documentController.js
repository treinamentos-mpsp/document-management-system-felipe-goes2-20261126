const service = require('../services/documentService');

function requireUser(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner) return res.status(400).json({ error: 'Informe o cabeçalho X-User-Id.' });
  req.owner = owner;
  next();
}

function upload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Informe um arquivo no campo file.' });
  return res.status(201).json(service.create(req.file, req.owner));
}

function list(req, res) {
  res.json(service.list(req.owner));
}

function download(req, res) {
  const document = service.findForDownload(req.params.id, req.owner);
  if (!document) return res.status(404).json({ error: 'Documento não encontrado.' });
  res.download(document.path, document.originalName, {
    headers: { 'Content-Type': document.mimeType },
  }, (error) => {
    if (!error) return;
    if (res.headersSent) return res.destroy(error);
    res.status(500).json({ error: 'Não foi possível ler o arquivo.' });
  });
}

module.exports = { requireUser, upload, list, download };