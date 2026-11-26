const { randomUUID } = require('node:crypto');
const path = require('node:path');
const repository = require('../repositories/documentRepository');
const { storageDir } = require('../config');

function publicDocument(document) {
  const { storedName, ...metadata } = document;
  return metadata;
}

function create(file, owner) {
  const document = repository.save({
    id: randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  });
  return publicDocument(document);
}

function list(owner) {
  return repository.findByOwner(owner).map(publicDocument);
}

function findForDownload(id, owner) {
  const document = repository.findById(id);
  if (!document || document.owner !== owner) return null;
  return {
    path: path.join(storageDir, document.storedName),
    originalName: document.originalName,
    mimeType: document.mimeType,
  };
}

module.exports = { create, list, findForDownload };