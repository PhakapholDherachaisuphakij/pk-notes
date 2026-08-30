import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fm from 'front-matter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5176;
const VAULT_ROOT = process.env.VAULT_ROOT || '/home/phakaphol/obsidian-vault';
const TYPHOON_API_KEY = process.env.TYPHOON_API_KEY || 'sk-c0v2c1K8eXhC7G2k9P5mQ4wL6nR8sT0uV3yZ1aB4dE7fH9jK';
const TYPHOON_BASE_URL = 'https://api.opentyphoon.ai/v1';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Ensure vault directory exists
if (!fs.existsSync(VAULT_ROOT)) {
  fs.mkdirSync(VAULT_ROOT, { recursive: true });
}

// Helper: Get full safe path
function getSafePath(relativePath = '') {
  const normalized = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(VAULT_ROOT, normalized);
  if (!fullPath.startsWith(VAULT_ROOT)) {
    throw new Error('Access denied: path traversal detected');
  }
  return fullPath;
}

// Helper: Build file tree
function getVaultTree(dir = VAULT_ROOT, relativeBase = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // ignore hidden files/folders (.obsidian, .git)
    const relPath = path.join(relativeBase, entry.name);
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push({
        type: 'folder',
        name: entry.name,
        path: relPath,
        children: getVaultTree(fullPath, relPath)
      });
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const stats = fs.statSync(fullPath);
      result.push({
        type: 'note',
        name: entry.name.replace(/\.md$/, ''),
        fileName: entry.name,
        path: relPath,
        updatedAt: stats.mtime
      });
    }
  }

  return result.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PK Notes Backend', vault: VAULT_ROOT, port: PORT });
});

// 2. Get vault file tree
app.get('/api/vault/tree', (req, res) => {
  try {
    const tree = getVaultTree();
    res.json({ success: true, tree });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Read note
app.get('/api/notes', (req, res) => {
  try {
    const notePath = req.query.path;
    if (!notePath) return res.status(400).json({ error: 'Path is required' });

    const fullPath = getSafePath(notePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const raw = fs.readFileSync(fullPath, 'utf8');
    const parsed = fm(raw);

    res.json({
      success: true,
      path: notePath,
      fileName: path.basename(notePath),
      title: parsed.attributes.title || path.basename(notePath, '.md'),
      attributes: parsed.attributes,
      body: parsed.body,
      raw
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Create or Save note
app.post('/api/notes', (req, res) => {
  try {
    const { path: relPath, title, body, attributes } = req.body;
    if (!relPath) return res.status(400).json({ error: 'Path is required' });

    let finalPath = relPath;
    if (!finalPath.endsWith('.md')) finalPath += '.md';

    const fullPath = getSafePath(finalPath);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Build Frontmatter YAML
    const meta = {
      title: title || path.basename(finalPath, '.md'),
      created: attributes?.created || new Date().toISOString().split('T')[0],
      category: attributes?.category || path.dirname(finalPath) === '.' ? 'General' : path.dirname(finalPath),
      tags: attributes?.tags || [],
      ...attributes
    };

    let yamlHeader = '---\n';
    for (const [k, v] of Object.entries(meta)) {
      if (Array.isArray(v)) {
        yamlHeader += `${k}: [${v.map(x => `"${x}"`).join(', ')}]\n`;
      } else {
        yamlHeader += `${k}: "${v}"\n`;
      }
    }
    yamlHeader += '---\n\n';

    const fullContent = yamlHeader + (body || '');
    fs.writeFileSync(fullPath, fullContent, 'utf8');

    res.json({ success: true, path: finalPath, title: meta.title });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete note
app.delete('/api/notes', (req, res) => {
  try {
    const notePath = req.query.path;
    if (!notePath) return res.status(400).json({ error: 'Path is required' });

    const fullPath = getSafePath(notePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    res.json({ success: true, deleted: notePath });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Create folder
app.post('/api/folders', (req, res) => {
  try {
    const { path: folderPath } = req.body;
    if (!folderPath) return res.status(400).json({ error: 'Folder path is required' });

    const fullPath = getSafePath(folderPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    res.json({ success: true, path: folderPath });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. AI Copilot: Summarize note
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const prompt = `คุณคือ Hermes / PK Notes AI Copilot สรุปเนื้อหาโน้ตต่อไปนี้ให้กระชับ ชัดเจน เป็น Bullet points พร้อมระบุ Key Takeaways:
หัวข้อ: ${title || 'Note'}
เนื้อหา:
"""
${content}
"""`;

    const response = await fetch(`${TYPHOON_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TYPHOON_API_KEY}`
      },
      body: JSON.stringify({
        model: 'typhoon-v2.5-30b-a3b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || 'ไม่สามารถสรุปได้';
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. AI Copilot: Ask entire Vault (RAG Search)
app.post('/api/ai/ask-vault', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    // Collect all markdown notes in vault
    function collectAllNotes(dir = VAULT_ROOT) {
      let notes = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith('.')) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          notes = notes.concat(collectAllNotes(full));
        } else if (e.isFile() && e.name.endsWith('.md')) {
          const raw = fs.readFileSync(full, 'utf8');
          notes.push(`[File: ${path.relative(VAULT_ROOT, full)}]\n${raw.slice(0, 1500)}`);
        }
      }
      return notes;
    }

    const allNotes = collectAllNotes().slice(0, 12).join('\n\n---\n\n');

    const prompt = `คุณคือ PK Notes Second Brain ผู้ช่วยอัจฉริยะที่เข้าถึง Obsidian Vault ทั้งหมดของ Phakaphol (PK)
โปรดตอบคำถามของผู้ใช้โดยอ้างอิงจากเนื้อหาใน Vault ต่อไปนี้อย่างกระชับและแม่นยำ พร้อมระบุชื่อไฟล์ที่อ้างอิง:

เนื้อหาใน Vault:
"""
${allNotes}
"""

คำถามของผู้ใช้:
"${question}"`;

    const response = await fetch(`${TYPHOON_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TYPHOON_API_KEY}`
      },
      body: JSON.stringify({
        model: 'typhoon-v2.5-30b-a3b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 800
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'ไม่พบคำตอบ';
    res.json({ success: true, answer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📝 PK Notes Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📂 Connected Obsidian Vault: ${VAULT_ROOT}`);
});
