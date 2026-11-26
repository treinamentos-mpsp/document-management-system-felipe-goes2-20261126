const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documentRepository');
const fileStorage = require('../repositories/fileStorage');

function create(metadata, owner) {
  return repository.save({
    id: randomUUID(),
    ...metadata,
    uploadedAt: new Date().toISOString(),
    owner,
  });
}

function list(owner) {
  return repository.findByOwner(owner);
}

function findForDownload(id, owner) {
  const document = repository.findById(id);
  if (!document || document.owner !== owner) return null;
  return {
    path: fileStorage.getPath(document.storedName),
    originalName: document.originalName,
    mimeType: document.mimeType,
  };
}

module.exports = { create, list, findForDownload };