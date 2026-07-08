import { Router } from 'express';
import db from '../db/init.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// 获取分类列表
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'ecommerce', name: '🛒 电商广告', count: 0 },
    { id: 'social', name: '📱 社交媒体', count: 0 },
    { id: 'branding', name: '🏷️ 品牌形象', count: 0 },
    { id: 'campaign', name: '🎉 活动推广', count: 0 },
    { id: 'marketing', name: '📊 营销素材', count: 0 },
    { id: 'shortvideo', name: '🎬 短视频素材', count: 0 },
  ];

  const counts = db.prepare('SELECT category, COUNT(*) as count FROM templates GROUP BY category').all();
  counts.forEach(c => {
    const cat = categories.find(x => x.id === c.category);
    if (cat) cat.count = c.count;
  });

  res.json({ categories });
});

// 获取精选推荐
router.get('/featured', (req, res) => {
  const templates = db.prepare('SELECT * FROM templates ORDER BY downloads DESC, likes DESC LIMIT 8').all();
  res.json({ templates });
});

// 获取模板列表（分页+搜索+筛选+排序）
router.get('/', (req, res) => {
  const { page = 1, limit = 20, search, category, ai_platform, price_type, sort = 'latest' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = '1=1';
  let params = [];

  if (search) {
    where += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    where += ' AND category = ?';
    params.push(category);
  }
  if (ai_platform) {
    where += ' AND ai_platform = ?';
    params.push(ai_platform);
  }
  if (price_type === 'free') {
    where += ' AND is_free = 1';
  } else if (price_type === 'paid') {
    where += ' AND is_free = 0';
  }

  let orderBy = 'created_at DESC';
  if (sort === 'popular') orderBy = 'downloads DESC';
  else if (sort === 'latest') orderBy = 'created_at DESC';
  else if (sort === 'price_asc') orderBy = 'price ASC';
  else if (sort === 'price_desc') orderBy = 'price DESC';

  const total = db.prepare(`SELECT COUNT(*) as total FROM templates WHERE ${where}`).get(...params);
  const templates = db.prepare(`SELECT * FROM templates WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

  res.json({
    templates,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total.total,
      totalPages: Math.ceil(total.total / parseInt(limit)),
    }
  });
});

// 获取模板详情
router.get('/:id', optionalAuth, (req, res) => {
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
  if (!template) {
    return res.status(404).json({ error: '模板不存在' });
  }

  let isFavorited = false;
  if (req.user) {
    const fav = db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND template_id = ?').get(req.user.id, template.id);
    isFavorited = !!fav;
  }

  // 解析 parameters JSON
  try {
    template.parameters = JSON.parse(template.parameters || '{}');
  } catch {
    template.parameters = {};
  }

  res.json({ template, isFavorited });
});

// 下载模板（扣积分）
router.post('/:id/download', authenticateToken, (req, res) => {
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
  if (!template) {
    return res.status(404).json({ error: '模板不存在' });
  }

  // 检查是否已经下载过
  const existing = db.prepare('SELECT id FROM downloads WHERE user_id = ? AND template_id = ?').get(req.user.id, template.id);
  if (existing) {
    return res.status(409).json({ error: '你已经下载过这个模板了，可在个人中心查看', already_downloaded: true });
  }

  // 免费模板直接下载
  if (template.is_free) {
    db.prepare('INSERT INTO downloads (user_id, template_id, credits_spent) VALUES (?, ?, 0)').run(req.user.id, template.id);
    db.prepare('UPDATE templates SET downloads = downloads + 1 WHERE id = ?').run(template.id);

    return res.json({
      success: true,
      template: {
        id: template.id,
        title: template.title,
        prompt_text: template.prompt_text,
        negative_prompt: template.negative_prompt,
        parameters: template.parameters,
        usage_guide: template.usage_guide,
      }
    });
  }

  // 付费模板检查积分
  const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id);
  if (user.credits < template.price) {
    return res.status(402).json({ error: `积分不足！需要 ${template.price} 积分，当前 ${user.credits} 积分`, need_credits: template.price - user.credits });
  }

  // 扣费 + 记录
  const transaction = db.transaction(() => {
    db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(template.price, req.user.id);
    db.prepare('INSERT INTO downloads (user_id, template_id, credits_spent) VALUES (?, ?, ?)').run(req.user.id, template.id, template.price);
    db.prepare('INSERT INTO credit_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, ?, ?, ?)').run(req.user.id, -template.price, 'download', `下载模板: ${template.title}`, template.id);
    db.prepare('UPDATE templates SET downloads = downloads + 1 WHERE id = ?').run(template.id);
  });

  transaction();

  res.json({
    success: true,
    credits_remaining: user.credits - template.price,
    template: {
      id: template.id,
      title: template.title,
      prompt_text: template.prompt_text,
      negative_prompt: template.negative_prompt,
      parameters: template.parameters,
      usage_guide: template.usage_guide,
    }
  });
});

// 收藏/取消收藏
router.post('/:id/favorite', authenticateToken, (req, res) => {
  const template = db.prepare('SELECT id FROM templates WHERE id = ?').get(req.params.id);
  if (!template) {
    return res.status(404).json({ error: '模板不存在' });
  }

  const existing = db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND template_id = ?').get(req.user.id, template.id);

  if (existing) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND template_id = ?').run(req.user.id, template.id);
    db.prepare('UPDATE templates SET likes = MAX(0, likes - 1) WHERE id = ?').run(template.id);
    res.json({ favorited: false });
  } else {
    db.prepare('INSERT INTO favorites (user_id, template_id) VALUES (?, ?)').run(req.user.id, template.id);
    db.prepare('UPDATE templates SET likes = likes + 1 WHERE id = ?').run(template.id);
    res.json({ favorited: true });
  }
});

export default router;
