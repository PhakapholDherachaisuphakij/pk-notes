import { supabase } from './_lib/supabase.js';
import { checkRateLimit } from './_lib/rateLimiter.js';

const TYPHOON_API_KEY = process.env.TYPHOON_API_KEY || 'sk-qkoC40SvURZUR0WMJFJGnI1Zul2R5Dyq6v2qarA2Fv6hFcyT';
const TYPHOON_BASE_URL = process.env.TYPHOON_BASE_URL || 'https://api.opentyphoon.ai/v1';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 1. Anti-DDoS Rate Limiting on AI Queries (Max 15 queries per minute per IP)
  const rate = checkRateLimit(req, 'ai_query', 15, 60 * 1000);
  if (!rate.allowed) {
    return res.status(429).json({
      error: `AI query limit reached for this IP. Please wait ${rate.resetInSeconds} seconds before trying again.`
    });
  }

  const { action, question, content, title } = req.body;

  // Mode A: Summarize Note
  if (action === 'summarize' || (content && !question)) {
    try {
      if (!content) return res.status(400).json({ error: 'Content is required' });

      const prompt = `คุณคือ Hermes & PK Notes AI Copilot สรุปเนื้อหาโน้ตต่อไปนี้ให้กระชับ ชัดเจน เป็น Bullet points พร้อมระบุ Key Takeaways:
หัวข้อ: ${title || 'Note'}
เนื้อหา:
"""
${String(content).slice(0, 4000)}
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

      if (!response.ok) throw new Error(`Typhoon status ${response.status}`);
      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content || 'ไม่สามารถสรุปได้';
      return res.json({ success: true, summary });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Mode B: Ask Vault (Second Brain RAG)
  if (action === 'ask-vault' || question) {
    try {
      if (!question) return res.status(400).json({ error: 'Question is required' });

      // Fetch notes from Supabase
      const { data: dbNotes } = await supabase
        .from('vault_notes')
        .select('path, title, body')
        .limit(10);

      const allNotes = (dbNotes || [])
        .map(n => `[File: ${n.path}]\n${(n.body || '').slice(0, 1500)}`)
        .join('\n\n---\n\n');

      const prompt = `คุณคือ PK Notes Second Brain ผู้ช่วยอัจฉริยะที่เข้าถึง Obsidian Vault ทั้งหมดของ Phakaphol (PK)
โปรดตอบคำถามของผู้ใช้โดยอ้างอิงจากเนื้อหาใน Vault ต่อไปนี้อย่างกระชับและแม่นยำ พร้อมระบุชื่อไฟล์ที่อ้างอิง:

เนื้อหาใน Vault:
"""
${allNotes}
"""

คำถามของผู้ใช้:
"${String(question).slice(0, 500)}"`;

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

      if (!response.ok) throw new Error(`Typhoon status ${response.status}`);
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || 'ไม่พบข้อมูลในคลังโน้ต';
      return res.json({ success: true, answer });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
