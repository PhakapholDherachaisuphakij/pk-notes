// Simple in-memory sliding window rate limiter for Vercel Serverless
const ipRequestMap = new Map();

// Clean up stale entries every 10 minutes (unref so it doesn't hold event loop open)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipRequestMap.entries()) {
    if (now - record.resetTime > 0) {
      ipRequestMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

export function checkRateLimit(req, action = 'default', limit = 10, windowMs = 60 * 1000) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || '127.0.0.1';
  const key = `${action}:${ip}`;
  const now = Date.now();

  let record = ipRequestMap.get(key);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    ipRequestMap.set(key, record);
    return { allowed: true, remaining: limit - 1, resetInSeconds: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetInSeconds: Math.ceil((record.resetTime - now) / 1000) 
    };
  }

  record.count += 1;
  return { 
    allowed: true, 
    remaining: limit - record.count, 
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000) 
  };
}
