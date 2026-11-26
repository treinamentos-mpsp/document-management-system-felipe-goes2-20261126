const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

const storageDirectory = path.join(__dirname, '../storage');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download de documentos', async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let uploadedFilename;

  try {
    const existingFiles = new Set(await fs.readdir(storageDirectory));
    const emptyUpload = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: new FormData(),
    });
    assert.strictEqual(emptyUpload.status, 400);

    const form = new FormData();
    form.append('file', new Blob(['conteúdo do documento']), 'documento.txt');
    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: form,
    });
    uploadedFilename = (await fs.readdir(storageDirectory)).find(
      (filename) => !existingFiles.has(filename),
    );
    assert.strictEqual(uploadResponse.status, 201);

    const uploadedDocument = await uploadResponse.json();
    assert.strictEqual(uploadedDocument.name, 'documento.txt');
    assert.strictEqual(uploadedDocument.size, Buffer.byteLength('conteúdo do documento'));
    assert.ok(uploadedDocument.id);
    assert.ok(uploadedFilename, 'o arquivo deve ser gravado no armazenamento local');

    const listResponse = await fetch(`${baseUrl}/documents`);
    assert.strictEqual(listResponse.status, 200);
    const documents = await listResponse.json();
    assert.ok(documents.some((document) => document.id === uploadedDocument.id));
    assert.ok(!JSON.stringify(documents).includes(uploadedFilename));

    const downloadResponse = await fetch(
      `${baseUrl}/documents/${uploadedDocument.id}/download`,
    );
    assert.strictEqual(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition'), /documento\.txt/);
    assert.strictEqual(await downloadResponse.text(), 'conteúdo do documento');

    const missingDownload = await fetch(`${baseUrl}/documents/unknown/download`);
    assert.strictEqual(missingDownload.status, 404);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    if (uploadedFilename) {
      await fs.rm(path.join(storageDirectory, uploadedFilename), { force: true });
    }
  }
});
