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
const downloadRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Limite de downloads excedido.' },
});

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
router.get('/documents/:id/download', downloadRateLimit, controller.requireUser, controller.download);

module.exports = router;