const path = require('node:path');

const maxUploadSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES || 10485760);
if (!Number.isSafeInteger(maxUploadSize) || maxUploadSize <= 0) {
  throw new Error('MAX_UPLOAD_SIZE_BYTES deve ser um inteiro positivo.');
}

module.exports = {
  storageDir: path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '../storage')),
  maxUploadSize,
};