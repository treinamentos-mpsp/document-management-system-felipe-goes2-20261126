const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_UPLOAD_SIZE_BYTES = '16';
const app = require('../src/app');
const server = app.listen(0);

after(() => {
  server.close();
  fs.rmSync(storageDir, { recursive: true, force: true });
});

test('upload, listagem e download respeitam os contratos e o dono', async () => {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const userHeaders = { 'X-User-Id': 'usuario-1' };
  const otherHeaders = { 'X-User-Id': 'usuario-2' };

  let response = await fetch(`${baseUrl}/documents`);
  assert.equal(response.status, 400);
  assert.ok((await response.json()).error);
  response = await fetch(`${baseUrl}/nao-existe`);
  assert.equal(response.status, 404);

  const unauthorized = new FormData();
  unauthorized.append('file', new Blob(['conteudo']), 'teste.txt');
  response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: unauthorized });
  assert.equal(response.status, 400);
  assert.equal(fs.readdirSync(storageDir).length, 0);

  response = await fetch(`${baseUrl}/documents`, { headers: userHeaders });
  assert.deepEqual(await response.json(), []);

  const form = new FormData();
  form.append('file', new Blob(['conteudo'], { type: 'text/plain' }), 'teste.txt');
  response = await fetch(`${baseUrl}/upload`, { method: 'POST', headers: userHeaders, body: form });
  assert.equal(response.status, 201);
  const document = await response.json();
  assert.equal(document.originalName, 'teste.txt');
  assert.equal(document.mimeType, 'text/plain');
  assert.equal(document.size, 8);
  assert.equal(document.owner, 'usuario-1');
  assert.ok(document.id);
  assert.ok(!('storedName' in document));
  assert.equal(fs.readdirSync(storageDir).length, 1);

  response = await fetch(`${baseUrl}/documents`, { headers: userHeaders });
  assert.deepEqual(await response.json(), [document]);
  response = await fetch(`${baseUrl}/documents`, { headers: otherHeaders });
  assert.deepEqual(await response.json(), []);
  response = await fetch(`${baseUrl}/documents/${document.id}/download`, { headers: otherHeaders });
  assert.equal(response.status, 404);

  response = await fetch(`${baseUrl}/documents/${document.id}/download`, { headers: userHeaders });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /attachment;.*teste\.txt/);
  assert.match(response.headers.get('content-type'), /^text\/plain/);
  assert.equal(await response.text(), 'conteudo');

  response = await fetch(`${baseUrl}/upload`, { method: 'POST', headers: userHeaders, body: new FormData() });
  assert.equal(response.status, 400);
  const oversized = new FormData();
  oversized.append('file', new Blob(['a'.repeat(17)]), 'grande.txt');
  response = await fetch(`${baseUrl}/upload`, { method: 'POST', headers: userHeaders, body: oversized });
  assert.equal(response.status, 413);
  assert.equal(fs.readdirSync(storageDir).length, 1);

  const exactLimit = new FormData();
  exactLimit.append('file', new Blob(['a'.repeat(16)]), 'limite.txt');
  response = await fetch(`${baseUrl}/upload`, { method: 'POST', headers: userHeaders, body: exactLimit });
  assert.equal(response.status, 201);

  const storedFile = fs.readdirSync(storageDir).find((name) => name.endsWith('.txt') && fs.readFileSync(path.join(storageDir, name), 'utf8') === 'conteudo');
  fs.unlinkSync(path.join(storageDir, storedFile));
  response = await fetch(`${baseUrl}/documents/${document.id}/download`, { headers: userHeaders });
  assert.equal(response.status, 500);
  assert.ok((await response.json()).error);
});