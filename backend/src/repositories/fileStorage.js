const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const { storageDir } = require('../config');

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDir, { recursive: true }, (error) => callback(error, storageDir));
  },
  filename(req, file, callback) {
    callback(null, `${randomUUID()}${path.extname(file.originalname)}`);
  },
});

function getPath(storedName) {
  if (typeof storedName !== 'string' || path.basename(storedName) !== storedName || storedName.includes('\\')) {
    throw new Error('Nome de arquivo armazenado inválido.');
  }
  const filePath = path.resolve(storageDir, storedName);
  if (path.dirname(filePath) !== storageDir) throw new Error('Caminho de arquivo armazenado inválido.');
  return filePath;
}

module.exports = { storage, getPath };