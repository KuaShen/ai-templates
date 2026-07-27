/**
 * 爬虫管理 API 路由（管理员用）
 * POST /api/admin/crawler/run       - 启动爬虫
 * GET  /api/admin/crawler/sources   - 获取可用数据源
 * GET  /api/admin/crawler/status    - 获取爬虫运行状态
 */
import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { crawlSource, crawlAll, getAvailableSources } from '../crawler/index.js';
import db from '../db/init.js';

const router = Router();

// 所有路由需要管理员权限
router.use(authenticateToken, requireAdmin);

// 爬虫运行状态（进程级）
let crawlerState = {
  running: false,
  lastRun: null,
  lastResult: null,
  error: null,
};

// 获取可用数据源
router.get('/sources', (req, res) => {
  const sources = getAvailableSources();
  res.json({ sources });
});

// 获取爬虫状态
router.get('/status', (req, res) => {
  // 获取当前数据库模板总数
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_templates,
      COUNT(DISTINCT category) as category_count,
      GROUP_CONCAT(DISTINCT category) as categories
      FROM templates
  `).get();

  // 各分类数量
  const categoryStats = db.prepare('SELECT category, COUNT(*) as count FROM templates GROUP BY category ORDER BY count DESC').all();

  res.json({
    running: crawlerState.running,
    lastRun: crawlerState.lastRun,
    lastResult: crawlerState.lastResult,
    error: crawlerState.error,
    database: {
      totalTemplates: stats.total_templates || 0,
      categories: stats.categories ? stats.categories.split(',') : [],
      categoryStats,
    },
  });
});

// 启动爬虫
router.post('/run', async (req, res) => {
  if (crawlerState.running) {
    return res.status(409).json({ error: '爬虫正在运行中，请等待完成' });
  }

  const { source = 'all', pages = 2, items = 8, maxQueries = null, category = null } = req.body;

  const options = { pages, items, maxQueries, category };

  // 异步启动爬虫，立即返回
  crawlerState.running = true;
  crawlerState.error = null;
  crawlerState.lastRun = new Date().toISOString();

  const promise = (source === 'all')
    ? crawlAll(undefined, options)
    : crawlSource(source, options);

  promise
    .then(result => {
      crawlerState.running = false;
      crawlerState.lastResult = result;
      console.log('✅ 爬虫任务完成:', result);
    })
    .catch(err => {
      crawlerState.running = false;
      crawlerState.error = err.message;
      console.error('❌ 爬虫任务失败:', err);
    });

  res.json({
    success: true,
    message: `爬虫已启动: ${source}`,
    source,
  });
});

export default router;
