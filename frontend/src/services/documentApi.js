async function request(path, userId, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { ...options.headers, 'X-User-Id': userId },
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Não foi possível concluir a operação.');
  }
  return response;
}

export async function uploadDocument(file, userId) {
  const form = new FormData();
  form.append('file', file);
  const response = await request('/upload', userId, { method: 'POST', body: form });
  return response.json();
}

export async function listDocuments(userId) {
  const response = await request('/documents', userId);
  return response.json();
}

export async function downloadDocument(id, userId) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`, userId);
  return response.blob();
}

export async function downloadDocumentToFile(id, userId, fileHandle) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`, userId);
  const writable = await fileHandle.createWritable();
  if (response.body) {
    await response.body.pipeTo(writable);
  } else {
    await writable.write(await response.blob());
    await writable.close();
  }
}