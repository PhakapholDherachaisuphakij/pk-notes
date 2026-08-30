import { STATIC_VAULT_TREE } from '../data/staticVault.js';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE = isLocal 
  ? 'http://localhost:5176/api' 
  : '/api';

// Helper: Find note recursively in static fallback snapshot
function findNoteInTree(items, targetPath) {
  for (const item of items) {
    if (item.type === 'note' && item.path === targetPath) {
      return item;
    }
    if (item.children) {
      const res = findNoteInTree(item.children, targetPath);
      if (res) return res;
    }
  }
  return null;
}

export async function fetchVaultTree() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE}/vault/tree`, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.tree && data.tree.length > 0) return data.tree;
    }
  } catch (err) {
    console.warn('Network fetch failed, using instant Static Vault Snapshot:', err.message);
  }

  // 100% Guaranteed Static Snapshot Fallback (Never fails, 0ms load)
  return STATIC_VAULT_TREE;
}

export async function fetchNote(path) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE}/notes?path=${encodeURIComponent(path)}`, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Network note fetch failed, using Static Snapshot note:', err.message);
  }

  const staticNote = findNoteInTree(STATIC_VAULT_TREE, path);
  if (staticNote) {
    return {
      success: true,
      path: staticNote.path,
      fileName: staticNote.fileName,
      title: staticNote.title,
      attributes: staticNote.attributes,
      body: staticNote.body,
      raw: staticNote.raw
    };
  }

  throw new Error('Note not found');
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
    body: JSON.stringify({ action: 'summarize', title, content })
  });
  if (!res.ok) throw new Error(`AI summarize failed: ${res.status}`);
  const data = await res.json();
  return data.summary || '';
}

export async function askVault(question) {
  const res = await fetch(`${API_BASE}/ai/ask-vault`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ask-vault', question })
  });
  if (!res.ok) throw new Error(`AI ask vault failed: ${res.status}`);
  const data = await res.json();
  return data.answer || '';
}

export async function requestAccess(name, email, password, reason) {
  const res = await fetch(`${API_BASE}/auth/request-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'request-access', name, email, password, reason })
  });
  let data = {};
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    if (!res.ok) throw new Error(`Server returned status ${res.status}`);
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  let data = {};
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    if (!res.ok) throw new Error(`Server returned status ${res.status}`);
  }
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}
