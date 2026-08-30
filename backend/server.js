import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fm from 'front-matter';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5176;
const VAULT_ROOT = process.env.VAULT_ROOT || '/home/phakaphol/obsidian-vault';
const ADMIN_PIN = process.env.ADMIN_PIN || '111248';
const TYPHOON_API_KEY = process.env.TYPHOON_API_KEY || 'sk-qkoC40SvURZUR0WMJFJGnI1Zul2R5Dyq6v2qarA2Fv6hFcyT';
const TYPHOON_BASE_URL = process.env.TYPHOON_BASE_URL || 'https://api.opentyphoon.ai/v1';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:8000';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

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

// Helper: Build file tree from disk
function getVaultTree(dir = VAULT_ROOT, relativeBase = '') {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
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

// 2. Auth: Submit Access Request
app.post('/api/auth/request-access', async (req, res) => {
  try {
    const { name, email, password, reason } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, Email, and Password are required' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from('note_access_requests')
      .upsert({
        name,
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        reason: reason || 'Request access to PK Notes',
        status: 'pending',
        role: 'editor'
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: 'Access request submitted! Waiting for Admin Phakaphol approval.', data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, pin } = req.body;

    // Admin Master PIN Login
    if (pin && pin === ADMIN_PIN) {
      return res.json({
        success: true,
        user: { name: 'Phakaphol (Admin)', email: 'admin@pk-notes.local', role: 'admin' },
        token: 'pk_master_admin_token'
      });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: user, error } = await supabase
      .from('note_access_requests')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found. Please submit an access request.' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ 
        error: `Your access request is currently "${user.status}". Please wait for Phakaphol to approve in PK Brain.` 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: `pk_user_${user.id}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get vault file tree
app.get('/api/vault/tree', async (req, res) => {
  try {
    const localTree = getVaultTree();
    if (localTree.length > 0) {
      return res.json({ success: true, tree: localTree });
    }

    // Fallback to Supabase vault_notes
    const { data: dbNotes } = await supabase.from('vault_notes').select('path, title, updated_at');
    const treeMap = {};
    for (const n of dbNotes || []) {
      const parts = n.path.split('/');
      if (parts.length > 1) {
        const folder = parts[0];
        if (!treeMap[folder]) treeMap[folder] = { type: 'folder', name: folder, path: folder, children: [] };
        treeMap[folder].children.push({
          type: 'note',
          name: n.title || parts[1].replace(/\.md$/, ''),
          fileName: parts[1],
          path: n.path,
          updatedAt: n.updated_at
        });
      } else {
        treeMap[n.path] = {
          type: 'note',
          name: n.title || n.path.replace(/\.md$/, ''),
          fileName: n.path,
          path: n.path,
          updatedAt: n.updated_at
        };
      }
    }
    res.json({ success: true, tree: Object.values(treeMap) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Read note
app.get('/api/notes', async (req, res) => {
  try {
    const notePath = req.query.path;
    if (!notePath) return res.status(400).json({ error: 'Path is required' });

    const fullPath = getSafePath(notePath);
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const parsed = fm(raw);
      return res.json({
        success: true,
        path: notePath,
        fileName: path.basename(notePath),
        title: parsed.attributes.title || path.basename(notePath, '.md'),
        attributes: parsed.attributes,
        body: parsed.body,
        raw
      });
    }

    // Fallback to Supabase
    const { data: dbNote } = await supabase.from('vault_notes').select('*').eq('path', notePath).maybeSingle();
    if (dbNote) {
      return res.json({
        success: true,
        path: dbNote.path,
        fileName: path.basename(dbNote.path),
        title: dbNote.title,
        attributes: dbNote.attributes,
        body: dbNote.body
      });
    }

    res.status(404).json({ error: 'Note not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Create or Save note (Writes to Disk + Syncs to Supabase DB)
app.post('/api/notes', async (req, res) => {
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

    const meta = {
      title: title || path.basename(finalPath, '.md'),
      created: attributes?.created || new Date().toISOString().split('T')[0],
      category: attributes?.category || (path.dirname(finalPath) === '.' ? 'General' : path.dirname(finalPath)),
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

    // Sync to Supabase DB for Vercel/Cloud availability
    await supabase.from('vault_notes').upsert({
      path: finalPath,
      title: meta.title,
      body: body || '',
      attributes: meta,
      updated_at: new Date().toISOString()
    }).catch(e => console.warn('Supabase note sync warning:', e.message));

    res.json({ success: true, path: finalPath, title: meta.title });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Delete note
app.delete('/api/notes', async (req, res) => {
  try {
    const notePath = req.query.path;
    if (!notePath) return res.status(400).json({ error: 'Path is required' });

    const fullPath = getSafePath(notePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    await supabase.from('vault_notes').delete().eq('path', notePath).catch(() => {});

    res.json({ success: true, deleted: notePath });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Create folder
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

// 9. AI Copilot: Summarize note with Typhoon AI
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const prompt = `คุณคือ Hermes & PK Notes AI Copilot สรุปเนื้อหาโน้ตต่อไปนี้ให้กระชับ ชัดเจน เป็น Bullet points พร้อมระบุ Key Takeaways:
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

    if (!response.ok) throw new Error(`Typhoon AI status ${response.status}`);
    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || 'ไม่สามารถสรุปได้';
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. AI Copilot: Ask entire Vault (RAG Search)
app.post('/api/ai/ask-vault', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    function collectAllNotes(dir = VAULT_ROOT) {
      let notes = [];
      if (!fs.existsSync(dir)) return notes;
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

    let allNotes = collectAllNotes().slice(0, 12).join('\n\n---\n\n');
    if (!allNotes) {
      const { data: dbNotes } = await supabase.from('vault_notes').select('path, title, body').limit(10);
      allNotes = (dbNotes || []).map(n => `[File: ${n.path}]\n${n.body}`).join('\n\n---\n\n');
    }

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

    if (!response.ok) throw new Error(`Typhoon AI status ${response.status}`);
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'ไม่พบข้อมูลในคลังโน้ต';
    res.json({ success: true, answer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📝 PK Notes Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📂 Connected Obsidian Vault: ${VAULT_ROOT}`);
});
