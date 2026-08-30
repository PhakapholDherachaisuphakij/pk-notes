const API_BASE = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? 'http://localhost:5176/api'
  : `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5176/api`;

export async function fetchVaultTree() {
  const res = await fetch(`${API_BASE}/vault/tree`);
  if (!res.ok) throw new Error(`Vault fetch failed: ${res.status}`);
  const data = await res.json();
  return data.tree || [];
}

export async function fetchNote(path) {
  const res = await fetch(`${API_BASE}/notes?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`Note fetch failed: ${res.status}`);
  return await res.json();
}

export async function saveNote(path, title, body, attributes = {}) {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, title, body, attributes })
  });
  if (!res.ok) throw new Error(`Note save failed: ${res.status}`);
  return await res.json();
}

export async function deleteNote(path) {
  const res = await fetch(`${API_BASE}/notes?path=${encodeURIComponent(path)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return await res.json();
}

export async function createFolder(folderPath) {
  const res = await fetch(`${API_BASE}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: folderPath })
  });
  if (!res.ok) throw new Error(`Folder create failed: ${res.status}`);
  return await res.json();
}

export async function summarizeNote(title, content) {
  const res = await fetch(`${API_BASE}/ai/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });
  if (!res.ok) throw new Error(`AI summarize failed: ${res.status}`);
  const data = await res.json();
  return data.summary || '';
}

export async function askVault(question) {
  const res = await fetch(`${API_BASE}/ai/ask-vault`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  if (!res.ok) throw new Error(`AI ask vault failed: ${res.status}`);
  const data = await res.json();
  return data.answer || '';
}
