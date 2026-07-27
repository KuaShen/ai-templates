/**
 * 爬虫工具函数库
 */

/**
 * 延迟等待（避免请求过快被限制）
 * @param {number} ms - 毫秒数
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成随机 User-Agent
 */
export function randomUA() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Edge/125.0.0.0',
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

/**
 * 生成随机延迟（避免模式被检测）
 * @param {number} min - 最小毫秒
 * @param {number} max - 最大毫秒
 */
export function randomDelay(min = 1000, max = 3000) {
  return sleep(min + Math.random() * (max - min));
}

/**
 * 从 URL 提取域名作为来源标记
 */
export function extractSource(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

/**
 * 将外部平台名映射到系统内部标识
 */
export function mapPlatform(platform) {
  const map = {
    'midjourney': 'midjourney',
    'mj': 'midjourney',
    'mid-journey': 'midjourney',
    'dalle': 'dalle3',
    'dall-e': 'dalle3',
    'dall-e 3': 'dalle3',
    'dalle3': 'dalle3',
    'stable diffusion': 'stable-diffusion',
    'sd': 'stable-diffusion',
    'sdxl': 'stable-diffusion',
    'firefly': 'firefly',
    'adobe firefly': 'firefly',
  };
  return map[platform.toLowerCase().trim()] || 'midjourney';
}

/**
 * 将外部分类名映射到系统分类
 */
export function mapCategory(keywords) {
  const text = keywords.toLowerCase();
  if (text.includes('ecommerce') || text.includes('product') || text.includes('shop') || text.includes('电商') || text.includes('产品')) return 'ecommerce';
  if (text.includes('social') || text.includes('instagram') || text.includes('facebook') || text.includes('小红书') || text.includes('社交') || text.includes('media')) return 'social';
  if (text.includes('brand') || text.includes('logo') || text.includes('identity') || text.includes('品牌') || text.includes('vi') || text.includes('logo')) return 'branding';
  if (text.includes('campaign') || text.includes('promotion') || text.includes('sale') || text.includes('festival') || text.includes('活动') || text.includes('促销') || text.includes('节日')) return 'campaign';
  if (text.includes('marketing') || text.includes('banner') || text.includes('poster') || text.includes('营销') || text.includes('banner') || text.includes('海报')) return 'marketing';
  if (text.includes('video') || text.includes('short') || text.includes('tiktok') || text.includes('douyin') || text.includes('视频') || text.includes('短视频')) return 'shortvideo';
  if (text.includes('portrait') || text.includes('人物') || text.includes('人像')) return 'ecommerce';
  if (text.includes('landscape') || text.includes('风景') || text.includes('travel') || text.includes('旅行') || text.includes('nature') || text.includes('自然')) return 'social';
  if (text.includes('food') || text.includes('drink') || text.includes('美食') || text.includes('餐饮') || text.includes('coffee') || text.includes('咖啡')) return 'ecommerce';
  if (text.includes('fashion') || text.includes('clothing') || text.includes('wear') || text.includes('时尚') || text.includes('服装') || text.includes('穿搭')) return 'social';
  return 'ecommerce';
}

/**
 * 生成唯一 ID（基于来源+序号）
 */
export function generateId(prefix, index) {
  const code = index.toString(36).padStart(3, '0');
  return `${prefix}-${code}`;
}

/**
 * 简单去重：根据标题判断是否已存在
 * @param {import('better-sqlite3').Database} db
 * @param {string} title
 */
export function isDuplicate(db, title) {
  const existing = db.prepare('SELECT id FROM templates WHERE title = ?').get(title);
  return !!existing;
}

/**
 * 分类统计计数
 */
export function printStats(results) {
  console.log('\n======= 📊 爬取统计 =======');
  console.log(`总计抓取: ${results.total}`);
  console.log(`成功插入: ${results.inserted}`);
  console.log(`已跳过(重复): ${results.skipped}`);
  console.log(`失败: ${results.failed}`);

  if (results.bySource && results.bySource.length > 0) {
    console.log('\n按来源:');
    results.bySource.forEach(s => {
      console.log(`  ${s.source}: ${s.count} 条`);
    });
  }

  if (results.byCategory && results.byCategory.length > 0) {
    console.log('\n按分类:');
    results.byCategory.forEach(c => {
      console.log(`  ${c.category}: ${c.count} 条`);
    });
  }

  console.log('===========================\n');
}
