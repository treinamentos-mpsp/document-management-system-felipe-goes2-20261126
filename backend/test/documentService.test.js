const { test } = require('node:test');
const assert = require('node:assert/strict');
const service = require('../src/services/documentService');

test('cria e lista documentos e limita o download ao dono', () => {
  const metadata = {
    originalName: 'teste.txt',
    storedName: 'arquivo.txt',
    mimeType: 'text/plain',
    size: 8,
  };
  const document = service.create(metadata, 'dono');

  assert.ok(document.id);
  assert.equal(document.owner, 'dono');
  assert.equal(document.storedName, metadata.storedName);
  assert.ok(!Number.isNaN(Date.parse(document.uploadedAt)));
  assert.deepEqual(service.list('dono'), [document]);
  assert.deepEqual(service.list('outro'), []);
  assert.equal(service.findForDownload(document.id, 'outro'), null);
  assert.equal(service.findForDownload('inexistente', 'dono'), null);
  assert.equal(service.findForDownload(document.id, 'dono').originalName, metadata.originalName);
});