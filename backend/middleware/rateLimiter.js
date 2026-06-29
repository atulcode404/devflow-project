// Custom memory-based rate limiter
const requestCounts = new Map();

// Clear the map every hour to prevent memory leaks
setInterval(() => requestCounts.clear(), 60 * 60 * 1000);

export const connectionRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: Date.now() + 60000 }); // 1 minute window
    return next();
  }

  const record = requestCounts.get(ip);
  if (Date.now() > record.resetTime) {
    // Reset window
    record.count = 1;
    record.resetTime = Date.now() + 60000;
    return next();
  }

  record.count += 1;
  if (record.count > 10) { // Max 10 requests per minute per IP for connections
    return res.status(429).json({ message: 'Too many connection requests. Please try again later.' });
  }

  next();
};
