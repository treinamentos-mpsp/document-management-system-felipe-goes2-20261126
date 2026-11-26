const { test, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.MAX_UPLOADS_PER_WINDOW = '2';
const app = require('../src/app');
const server = app.listen(0);
after(() => server.close());

test('limita requisições de upload por endereço IP', async () => {
  const url = `http://127.0.0.1:${server.address().port}/upload`;
  const options = { method: 'POST', headers: { 'X-User-Id': 'usuario' } };
  assert.equal((await fetch(url, options)).status, 400);
  assert.equal((await fetch(url, options)).status, 400);
  const response = await fetch(url, options);
  assert.equal(response.status, 429);
  assert.ok((await response.json()).error);
});