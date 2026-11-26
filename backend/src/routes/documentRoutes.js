const express = require('express');
const multer = require('multer');
const { rateLimit } = require('express-rate-limit');
const { maxUploadSize, maxUploadsPerWindow } = require('../config');
const { storage } = require('../repositories/fileStorage');
const controller = require('../controllers/documentController');

const upload = multer({
  storage,
  defParamCharset: 'utf8',
  limits: { fileSize: maxUploadSize, fields: 8, parts: 10, fieldSize: 1024 },
});
const router = express.Router();
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: maxUploadsPerWindow,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Limite de uploads atingido. Tente novamente mais tarde.' },
});
const downloadRequests = new Map();

function limitDownloads(req, res, next) {
  const now = Date.now();
  let requests = downloadRequests.get(req.ip);

  if (!requests || now - requests.startedAt >= 60_000) {
    if (downloadRequests.size >= 1000) {
      for (const [ip, entry] of downloadRequests) {
        if (now - entry.startedAt >= 60_000) {
          downloadRequests.delete(ip);
        }
      }
      if (downloadRequests.size >= 1000) {
        downloadRequests.delete(downloadRequests.keys().next().value);
      }
    }

    requests = { startedAt: now, count: 0 };
    downloadRequests.set(req.ip, requests);
  }

  if (requests.count >= 60) {
    return res.status(429).json({ error: 'Limite de downloads excedido.' });
  }

  requests.count += 1;
  return next();
}

function parseUpload(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (error && ['Multipart: Boundary not found', 'Unexpected end of form', 'Malformed part header'].includes(error.message)) {
      error.status = 400;
    }
    next(error);
  });
}

router.post('/upload', controller.requireUser, uploadRateLimit, parseUpload, controller.upload);
router.get('/documents', controller.requireUser, controller.list);
router.get('/documents/:id/download', limitDownloads, controller.requireUser, controller.download);

module.exports = router;