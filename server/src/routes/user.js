import { Router } from 'express';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 获取用户下载记录
router.get('/downloads', authenticateToken, (req, res) => {
  const downloads = db.prepare(`
    SELECT d.*, t.title as template_title, t.preview_url, t.is_free, t.price
    FROM downloads d
    LEFT JOIN templates t ON d.template_id = t.id
    WHERE d.user_id = ?
    ORDER BY d.created_at DESC
  `).all(req.user.id);

  res.json({ downloads: downloads.map(d => ({
    id: d.id,
    template_id: d.template_id,
    credits_spent: d.credits_spent,
    created_at: d.created_at,
    template: { title: d.template_title, preview_url: d.preview_url, is_free: d.is_free, price: d.price }
  })) });
});

// 获取用户收藏列表
router.get('/favorites', authenticateToken, (req, res) => {
  const templates = db.prepare(`
    SELECT t.* FROM templates t
    INNER JOIN favorites f ON t.id = f.template_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user.id);

  res.json({ templates });
});

export default router;
