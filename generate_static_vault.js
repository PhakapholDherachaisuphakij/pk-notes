import fs from 'fs';
import path from 'path';

const VAULT_ROOT = '/home/phakaphol/obsidian-vault';
const OUTPUT_FILE = '/home/phakaphol/projects/pk-notes/frontend/src/data/staticVault.js';

// Ensure data directory exists
const dataDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function parseMarkdown(raw) {
  let attributes = {};
  let body = raw;

  if (raw.startsWith('---')) {
    const endIdx = raw.indexOf('---', 3);
    if (endIdx !== -1) {
      const header = raw.slice(3, endIdx).trim();
      body = raw.slice(endIdx + 3).trim();
      const lines = header.split('\n');
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          const key = line.slice(0, colonIdx).trim();
          const val = line.slice(colonIdx + 1).trim();
          if (val.startsWith('[') && val.endsWith(']')) {
            attributes[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
          } else {
            attributes[key] = val.replace(/^["']|["']$/g, '');
          }
        }
      }
    }
  }

  return { attributes, body };
}

function scanVault(dir = VAULT_ROOT, relBase = '') {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const relPath = path.join(relBase, entry.name);
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push({
        type: 'folder',
        name: entry.name,
        path: relPath,
        children: scanVault(fullPath, relPath)
      });
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const parsed = parseMarkdown(raw);
      result.push({
        type: 'note',
        name: entry.name.replace(/\.md$/, ''),
        fileName: entry.name,
        path: relPath,
        title: parsed.attributes.title || entry.name.replace(/\.md$/, ''),
        attributes: parsed.attributes || {},
        body: parsed.body || '',
        raw
      });
    }
  }

  return result.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });
}

const vaultData = scanVault();
const code = `// Automatically generated Static Vault Snapshot for 100% Vercel Uptime
export const STATIC_VAULT_TREE = ${JSON.stringify(vaultData, null, 2)};
`;

fs.writeFileSync(OUTPUT_FILE, code, 'utf8');
console.log('✅ Generated static vault snapshot with', vaultData.length, 'root items.');
