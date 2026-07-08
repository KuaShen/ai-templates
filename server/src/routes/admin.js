import { Router } from 'express';
import db from '../db/init.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = Router();

// 所有管理路由需要认证+管理员
router.use(authenticateToken, requireAdmin);

// 获取统计数据
router.get('/stats', (req, res) => {
  const totalTemplates = db.prepare('SELECT COUNT(*) as count FROM templates').get();
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const totalDownloads = db.prepare('SELECT COUNT(*) as count FROM downloads').get();
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(credits_spent), 0) as total FROM downloads WHERE credits_spent > 0').get();

  const categoryStats = db.prepare('SELECT category, COUNT(*) as count FROM templates GROUP BY category').all();
  const platformStats = db.prepare('SELECT ai_platform, COUNT(*) as count FROM templates GROUP BY ai_platform').all();

  res.json({
    stats: {
      totalTemplates: totalTemplates.count,
      totalUsers: totalUsers.count,
      totalDownloads: totalDownloads.count,
      totalRevenue: totalRevenue.total,
      categoryStats,
      platformStats,
    }
  });
});

// 获取所有模板（管理用）
router.get('/templates', (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const total = db.prepare('SELECT COUNT(*) as total FROM templates').get();
  const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC LIMIT ? OFFSET ?').all(parseInt(limit), offset);

  res.json({ templates, total: total.total });
});

// 新增模板
router.post('/templates', (req, res) => {
  const { title, description, category, ai_platform, prompt_text, negative_prompt, parameters, usage_guide, is_free, price } = req.body;

  if (!title || !category || !ai_platform || !prompt_text) {
    return res.status(400).json({ error: '请填写必填字段' });
  }

  const id = randomUUID().slice(0, 8);

  db.prepare(`
    INSERT INTO templates (id, title, description, category, ai_platform, prompt_text, negative_prompt, parameters, usage_guide, is_free, price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || '', category, ai_platform, prompt_text, negative_prompt || '', parameters || '{}', usage_guide || '', is_free ? 1 : 0, price || 0);

  res.status(201).json({ success: true, id });
});

// 编辑模板
router.put('/templates/:id', (req, res) => {
  const { title, description, category, ai_platform, prompt_text, negative_prompt, parameters, usage_guide, is_free, price } = req.body;

  const exists = db.prepare('SELECT id FROM templates WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: '模板不存在' });

  db.prepare(`
    UPDATE templates SET title=?, description=?, category=?, ai_platform=?, prompt_text=?, negative_prompt=?, parameters=?, usage_guide=?, is_free=?, price=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(title, description || '', category, ai_platform, prompt_text, negative_prompt || '', parameters || '{}', usage_guide || '', is_free ? 1 : 0, price || 0, req.params.id);

  res.json({ success: true });
});

// 删除模板
router.delete('/templates/:id', (req, res) => {
  const exists = db.prepare('SELECT id FROM templates WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: '模板不存在' });

  db.prepare('DELETE FROM downloads WHERE template_id = ?').run(req.params.id);
  db.prepare('DELETE FROM favorites WHERE template_id = ?').run(req.params.id);
  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);

  res.json({ success: true, message: '模板已删除' });
});

// 获取用户列表
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, email, credits, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

export default router;
