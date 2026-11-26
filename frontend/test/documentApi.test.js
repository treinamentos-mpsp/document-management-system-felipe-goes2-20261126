import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { downloadDocument, downloadDocumentToFile, listDocuments, uploadDocument } from '../src/services/documentApi.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('envia arquivo e identificação para o backend', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/upload');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['X-User-Id'], 'usuario');
    assert.equal(await options.body.get('file').text(), 'conteudo');
    return Response.json({ id: '123' }, { status: 201 });
  };
  assert.deepEqual(await uploadDocument(new Blob(['conteudo']), 'usuario'), { id: '123' });
});

test('lista documentos e propaga mensagens de erro', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/documents');
    assert.equal(options.headers['X-User-Id'], 'usuario');
    return Response.json({ error: 'Erro de listagem.' }, { status: 400 });
  };
  await assert.rejects(listDocuments('usuario'), { message: 'Erro de listagem.' });
});

test('baixa o conteúdo usando o identificador codificado', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/documents/a%2Fb/download');
    assert.equal(options.headers['X-User-Id'], 'usuario');
    return new Response('conteudo');
  };
  assert.equal(await (await downloadDocument('a/b', 'usuario')).text(), 'conteudo');
});

test('informa falha de conexão em português', async () => {
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  await assert.rejects(listDocuments('usuario'), { message: 'Não foi possível conectar ao servidor.' });
});

test('grava o download em fluxo quando o navegador permite', async () => {
  const chunks = [];
  globalThis.fetch = async () => new Response('conteudo');
  const fileHandle = {
    async createWritable() {
      return new WritableStream({ write(chunk) { chunks.push(chunk); } });
    },
  };
  await downloadDocumentToFile('123', 'usuario', fileHandle);
  assert.equal(Buffer.concat(chunks).toString(), 'conteudo');
});