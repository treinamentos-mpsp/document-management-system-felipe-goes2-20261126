const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const fsSync = require('node:fs');
const storageDirectory = fsSync.mkdtempSync(path.join(os.tmpdir(), 'dms-app-test-'));
process.env.STORAGE_DIR = storageDirectory;
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download de documentos', async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const headers = { 'X-User-Id': 'usuario' };
  let uploadedFilename;

  try {
    const existingFiles = new Set(await fs.readdir(storageDirectory));
    const emptyUpload = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers,
      body: new FormData(),
    });
    assert.strictEqual(emptyUpload.status, 400);

    const form = new FormData();
    form.append('file', new Blob(['conteúdo do documento']), 'documento.txt');
    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers,
      body: form,
    });
    uploadedFilename = (await fs.readdir(storageDirectory)).find(
      (filename) => !existingFiles.has(filename),
    );
    assert.strictEqual(uploadResponse.status, 201);

    const uploadedDocument = await uploadResponse.json();
    assert.strictEqual(uploadedDocument.originalName, 'documento.txt');
    assert.strictEqual(uploadedDocument.size, Buffer.byteLength('conteúdo do documento'));
    assert.ok(uploadedDocument.id);
    assert.ok(uploadedFilename, 'o arquivo deve ser gravado no armazenamento local');

    const listResponse = await fetch(`${baseUrl}/documents`, { headers });
    assert.strictEqual(listResponse.status, 200);
    const documents = await listResponse.json();
    assert.ok(documents.some((document) => document.id === uploadedDocument.id));
    assert.ok(!JSON.stringify(documents).includes(uploadedFilename));

    const downloadResponse = await fetch(
      `${baseUrl}/documents/${uploadedDocument.id}/download`,
      { headers },
    );
    assert.strictEqual(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition'), /documento\.txt/);
    assert.strictEqual(await downloadResponse.text(), 'conteúdo do documento');

    const missingDownload = await fetch(`${baseUrl}/documents/unknown/download`, { headers });
    assert.strictEqual(missingDownload.status, 404);

    for (let request = 0; request < 58; request += 1) {
      const response = await fetch(
        `${baseUrl}/documents/${uploadedDocument.id}/download`,
        { headers },
      );
      assert.strictEqual(response.status, 200);
      await response.arrayBuffer();
    }

    const rateLimitedDownload = await fetch(
      `${baseUrl}/documents/${uploadedDocument.id}/download`,
      { headers },
    );
    assert.strictEqual(rateLimitedDownload.status, 429);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    if (uploadedFilename) {
      await fs.rm(path.join(storageDirectory, uploadedFilename), { force: true });
    }
    await fs.rm(storageDirectory, { recursive: true, force: true });
  }
});
