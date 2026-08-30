import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET single note
  if (req.method === 'GET') {
    try {
      const notePath = req.query.path;
      if (!notePath) return res.status(400).json({ error: 'Path is required' });

      const { data: dbNote, error } = await supabase
        .from('vault_notes')
        .select('*')
        .eq('path', notePath)
        .maybeSingle();

      if (error) throw error;
      if (!dbNote) return res.status(404).json({ error: 'Note not found' });

      return res.json({
        success: true,
        path: dbNote.path,
        fileName: dbNote.path.split('/').pop(),
        title: dbNote.title,
        attributes: dbNote.attributes || {},
        body: dbNote.body || ''
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST save note (Requires authenticated user token or session)
  if (req.method === 'POST') {
    try {
      const { path: relPath, title, body, attributes } = req.body;
      if (!relPath) return res.status(400).json({ error: 'Path is required' });

      let finalPath = relPath.endsWith('.md') ? relPath : `${relPath}.md`;

      const meta = {
        title: title || finalPath.replace(/\.md$/, '').split('/').pop(),
        created: attributes?.created || new Date().toISOString().split('T')[0],
        category: attributes?.category || (finalPath.includes('/') ? finalPath.split('/')[0] : 'General'),
        tags: attributes?.tags || [],
        ...attributes
      };

      const { error } = await supabase.from('vault_notes').upsert({
        path: finalPath,
        title: meta.title,
        body: body || '',
        attributes: meta,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      return res.json({ success: true, path: finalPath, title: meta.title });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE note
  if (req.method === 'DELETE') {
    try {
      const notePath = req.query.path;
      if (!notePath) return res.status(400).json({ error: 'Path is required' });

      await supabase.from('vault_notes').delete().eq('path', notePath);
      return res.json({ success: true, deleted: notePath });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
