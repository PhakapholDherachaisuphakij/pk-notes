import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { data: dbNotes, error } = await supabase
      .from('vault_notes')
      .select('path, title, updated_at')
      .order('path', { ascending: true });

    if (error) throw error;

    const treeMap = {};
    for (const n of dbNotes || []) {
      const parts = n.path.split('/');
      if (parts.length > 1) {
        const folder = parts[0];
        if (!treeMap[folder]) {
          treeMap[folder] = { type: 'folder', name: folder, path: folder, children: [] };
        }
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
}
