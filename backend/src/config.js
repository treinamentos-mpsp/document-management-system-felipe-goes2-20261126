const path = require('node:path');

const maxUploadSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES || 10485760);
if (!Number.isSafeInteger(maxUploadSize) || maxUploadSize <= 0 || !Number.isSafeInteger(maxUploadSize + 1)) {
  throw new Error('MAX_UPLOAD_SIZE_BYTES deve ser um inteiro positivo.');
}
const maxUploadsPerWindow = Number(process.env.MAX_UPLOADS_PER_WINDOW || 100);
if (!Number.isSafeInteger(maxUploadsPerWindow) || maxUploadsPerWindow <= 0) {
  throw new Error('MAX_UPLOADS_PER_WINDOW deve ser um inteiro positivo.');
}

module.exports = {
  storageDir: path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '../storage')),
  maxUploadSize,
  maxUploadsPerWindow,
};