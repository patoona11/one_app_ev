import rateLimit from 'express-rate-limit';

// Global API rate limiting to protect against DDoS and resource exhaustion
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 300, // Limit each IP to 300 requests per window
  message: {
    error: 'คำขอจากที่อยู่ IP นี้มีจำนวนมากเกินไป กรุณารอสักครู่แล้วลองใหม่ (Too many requests from this IP, please try again later)'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for authentication and user report submissions (Spam prevention)
export const reportSubmissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes window
  max: 15, // Max 15 reports per IP per window
  message: {
    error: 'คุณส่งรายงานบ่อยเกินไป เพื่อป้องกันสแปม กรุณารอสักครู่ (Rate limit exceeded for community reports)'
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: {
    error: 'พยายามลงชื่อเข้าใช้บ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่ (Too many login attempts)'
  }
});
