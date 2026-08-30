import { supabase } from './_lib/supabase.js';
import { checkRateLimit } from './_lib/rateLimiter.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const url = req.url || '';
  const isRequestAccess = url.includes('request-access') || req.body?.action === 'request-access';

  // 1. Anti-DDoS Rate Limiting on Access Requests (Max 5 requests per hour per IP)
  if (isRequestAccess) {
    const rate = checkRateLimit(req, 'request_access', 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return res.status(429).json({
        error: `Too many access requests from this IP. Please try again in ${Math.ceil(rate.resetInSeconds / 60)} minutes.`
      });
    }

    try {
      const { name, email, password, reason } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, Email, and Password are required' });
      }

      // Basic sanitization
      const cleanName = String(name).slice(0, 100).trim();
      const cleanEmail = String(email).slice(0, 120).toLowerCase().trim();
      const cleanReason = String(reason || '').slice(0, 500).trim();

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const { data, error } = await supabase
        .from('note_access_requests')
        .upsert({
          name: cleanName,
          email: cleanEmail,
          password_hash: passwordHash,
          reason: cleanReason || 'Request access to PK Notes',
          status: 'pending',
          role: 'editor'
        }, { onConflict: 'email' })
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Access request submitted! Waiting for Admin Phakaphol to approve in PK Brain.',
        data: { id: data.id, name: data.name, email: data.email }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. Login Endpoint (Rate limited to 10 attempts per minute per IP)
  const loginRate = checkRateLimit(req, 'login', 10, 60 * 1000);
  if (!loginRate.allowed) {
    return res.status(429).json({
      error: `Too many login attempts. Please wait ${loginRate.resetInSeconds} seconds before trying again.`
    });
  }

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: user, error } = await supabase
      .from('note_access_requests')
      .select('*')
      .eq('email', String(email).toLowerCase().trim())
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found. Please submit an access request.' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({
        error: `Your request is currently "${user.status}". Please wait for Phakaphol to approve in PK Brain.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    return res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: `pk_user_${user.id}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
