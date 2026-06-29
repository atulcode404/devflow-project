const rateLimitWindow = 60 * 1000; // 1 minute
const rateLimitMax = 100; // 100 requests per minute
const requestCounts = new Map();

export const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const timestamps = requestCounts.get(ip);
  const validTimestamps = timestamps.filter(t => now - t < rateLimitWindow);
  
  if (validTimestamps.length >= rateLimitMax) {
    return res.status(429).json({
      message: 'Too many requests. Please try again after a minute.'
    });
  }
  
  validTimestamps.push(now);
  requestCounts.set(ip, validTimestamps);
  next();
};
