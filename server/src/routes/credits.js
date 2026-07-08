import { Router } from 'express';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 每日签到
router.post('/checkin', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // 检查今天是否已经签到
  const existing = db.prepare(
    "SELECT id FROM credit_transactions WHERE user_id = ? AND type = 'daily_bonus' AND DATE(created_at) = ?"
  ).get(req.user.id, today);

  if (existing) {
    return res.status(409).json({ error: '今天已经签到过了，明天再来吧！' });
  }

  const bonus = 5;
  db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(bonus, req.user.id);
  db.prepare("INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, 'daily_bonus', ?)").run(req.user.id, bonus, '每日签到奖励');

  const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id);

  res.json({ success: true, bonus, credits: user.credits, message: `签到成功！获得 ${bonus} 积分` });
});

// 积分流水
router.get('/history', authenticateToken, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const total = db.prepare('SELECT COUNT(*) as total FROM credit_transactions WHERE user_id = ?').get(req.user.id);
  const transactions = db.prepare(
    'SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(req.user.id, parseInt(limit), offset);

  res.json({
    transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total.total,
      totalPages: Math.ceil(total.total / parseInt(limit)),
    }
  });
});

// 购买积分（预留Stripe接口）
router.post('/purchase', authenticateToken, (req, res) => {
  const { package_id } = req.body;

  const packages = {
    'small': { credits: 100, price: 9.99 },
    'medium': { credits: 350, price: 29.99 },
    'large': { credits: 1000, price: 69.99 },
  };

  const pkg = packages[package_id];
  if (!pkg) {
    return res.status(400).json({ error: '无效的积分套餐' });
  }

  // TODO: 接入 Stripe 支付
  // 模拟支付成功
  db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(pkg.credits, req.user.id);
  db.prepare("INSERT INTO credit_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, 'purchase', ?, ?)")
    .run(req.user.id, pkg.credits, `购买 ${pkg.credits} 积分套餐`, package_id);

  const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id);

  res.json({ success: true, credits_added: pkg.credits, credits: user.credits, message: `购买成功！获得 ${pkg.credits} 积分` });
});

export default router;
