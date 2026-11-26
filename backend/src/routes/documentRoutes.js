const express = require('express');
const multer = require('multer');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { storageDir, maxUploadSize } = require('../config');
const controller = require('../controllers/documentController');

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDir, { recursive: true }, (error) => callback(error, storageDir));
  },
  filename(req, file, callback) {
    callback(null, `${randomUUID()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: maxUploadSize + 1 } });
const router = express.Router();

router.post('/upload', controller.requireUser, upload.single('file'), controller.upload);
router.get('/documents', controller.requireUser, controller.list);
router.get('/documents/:id/download', controller.requireUser, controller.download);

module.exports = router;