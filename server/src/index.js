import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './db/init.js';
import authRoutes from './routes/auth.js';
import templateRoutes from './routes/templates.js';
import creditRoutes from './routes/credits.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import crawlerRoutes from './routes/crawler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// 初始化数据库
initDatabase();

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件 - 预览图
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/crawler', crawlerRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📦 API 地址: http://localhost:${PORT}/api`);
});
