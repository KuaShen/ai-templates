/**
 * Lexica.art 爬虫
 * 来源: https://lexica.art/
 * 专注 Stable Diffusion / Midjourney 提示词搜索
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../../db/init.js';
import { randomUA, randomDelay, mapPlatform, mapCategory, generateId, isDuplicate } from '../utils.js';

const SOURCE_NAME = 'lexica';
const BASE_URL = 'https://lexica.art';

// Lexica 搜索关键词（覆盖我们的分类体系）
const SEARCH_QUERIES = [
  { q: 'product photography ecommerce', platform: 'midjourney', weight: 'ecommerce' },
  { q: 'food photography commercial', platform: 'midjourney', weight: 'ecommerce' },
  { q: 'fashion portrait', platform: 'midjourney', weight: 'social' },
  { q: 'brand logo design', platform: 'midjourney', weight: 'branding' },
  { q: 'banner advertisement', platform: 'stable-diffusion', weight: 'marketing' },
  { q: 'social media post', platform: 'midjourney', weight: 'social' },
  { q: 'product mockup', platform: 'stable-diffusion', weight: 'ecommerce' },
  { q: 'interior design', platform: 'midjourney', weight: 'ecommerce' },
  { q: 'album cover art', platform: 'stable-diffusion', weight: 'campaign' },
  { q: 'jewelry macro photography', platform: 'midjourney', weight: 'ecommerce' },
  { q: 'cosmetic product', platform: 'midjourney', weight: 'ecommerce' },
  { q: 'packaging design', platform: 'midjourney', weight: 'branding' },
  { q: 'tech product shot', platform: 'stable-diffusion', weight: 'ecommerce' },
  { q: 'vibrant abstract', platform: 'midjourney', weight: 'campaign' },
  { q: 'minimalist still life', platform: 'midjourney', weight: 'ecommerce' },
  { q: 'furniture photography', platform: 'midjourney', weight: 'ecommerce' },
  { q: 'drink advertisement', platform: 'midjourney', weight: 'ecommerce' },
  { q: 'perfume luxury', platform: 'midjourney', weight: 'ecommerce' },
  { q: 'watch product', platform: 'dalle3', weight: 'ecommerce' },
  { q: 'shoe sneaker commercial', platform: 'midjourney', weight: 'ecommerce' },
];

function getConfig() {
  return {
    headers: {
      'User-Agent': randomUA(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': BASE_URL,
    },
    timeout: 15000,
  };
}

/**
 * 从 Lexica 搜索结果页解析模板
 */
function parseSearchResults(html, defaultPlatform) {
  const $ = cheerio.load(html);
  const items = [];

  // Lexica 的图片卡片结构
  $('a[href*="/prompt/"], a[href*="/s/"], a[href*="/c/"]').each((i, el) => {
    const href = $(el).attr('href');
    const img = $(el).find('img').first();
    const imgSrc = img.attr('src') || img.attr('data-src') || '';
    const alt = img.attr('alt') || '';

    if (href && imgSrc && alt) {
      const url = href.startsWith('http') ? href : BASE_URL + href;
      if (!items.some(i => i.url === url)) {
        items.push({
          url,
          title: alt.substring(0, 100),
          preview: imgSrc,
          platform: defaultPlatform,
        });
      }
    }
  });

  return items;
}

/**
 * 从 Lexica 详情页解析完整提示词
 */
async function parseDetailPage(url, title, preview, platform) {
  try {
    const { data: html } = await axios.get(url, { ...getConfig(), timeout: 12000 });
    const $ = cheerio.load(html);

    let promptText = '';
    let negativePrompt = '';
    const parameters = {};

    // Lexica 通常把提示词放在 textarea 或 pre/code 标签里
    $('textarea, pre, code, .prompt-text, [class*="prompt"]').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 15 && text.length > promptText.length) {
        promptText = text;
      }
    });

    // 检查 meta 标签
    if (!promptText || promptText.length < 10) {
      promptText = $('meta[name="description"]').attr('content') || '';
    }
    // 检查 script JSON
    if (!promptText || promptText.length < 10) {
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const data = JSON.parse($(el).html() || '{}');
          if (data.description && data.description.length > 20) promptText = data.description;
        } catch {}
      });
    }
    // 检查 title 相关
    if (!promptText || promptText.length < 10) {
      const pageTitle = $('title').text().trim();
      if (pageTitle.length > 15) promptText = pageTitle;
    }

    if (!promptText || promptText.length < 10) return null;

    // 提取描述
    let description = $('meta[name="description"]').attr('content') || '';
    if (!description || description.length < 5) description = title;
    description = description.substring(0, 200);

    // 提取 negative prompt
    $('[class*="negative"], [class*="neg"]').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 3) negativePrompt = text;
    });

    // 从提示词中提取 MJ 参数
    if (promptText.includes('--ar ')) {
      platform = 'midjourney';
      const arMatch = promptText.match(/--ar\s+([\d:]+)/);
      if (arMatch) parameters.aspect = arMatch[1];
      const sMatch = promptText.match(/--s\s+(\d+)/);
      if (sMatch) parameters.stylize = parseInt(sMatch[1]);
      const vMatch = promptText.match(/--v\s+([\d.]+)/);
      if (vMatch) parameters.version = vMatch[1];
    }
    // SD 参数
    if (promptText.includes('--steps') || promptText.includes('Steps:')) {
      platform = 'stable-diffusion';
      const stepsMatch = promptText.match(/Steps:\s*(\d+)/);
      if (stepsMatch) parameters.steps = parseInt(stepsMatch[1]);
      const cfgMatch = promptText.match(/CFG\s*scale:\s*([\d.]+)/);
      if (cfgMatch) parameters.cfg = parseFloat(cfgMatch[1]);
    }

    const category = mapCategory(title + ' ' + description);

    return {
      title: title.substring(0, 100),
      description,
      category,
      ai_platform: platform,
      prompt_text: promptText,
      negative_prompt: negativePrompt,
      parameters: JSON.stringify(parameters),
      usage_guide: `此模板适用于 ${platform}。根据需要可以修改主体描述、风格、构图等关键词来调整生成效果。`,
      preview_url: preview,
      is_free: 0,
      price: Math.floor(Math.random() * 4) ? 5 : 3,
      source_url: url,
    };
  } catch (err) {
    console.error(`  ❌ 解析详情失败: ${url.substring(0, 80)}`, err.message);
    return null;
  }
}

function insertTemplate(data) {
  try {
    if (isDuplicate(db, data.title)) {
      return { status: 'skipped', title: data.title };
    }

    const id = generateId('lx', Math.floor(Math.random() * 10000));

    db.prepare(`
      INSERT INTO templates (id, title, description, category, ai_platform, prompt_text, negative_prompt, parameters, usage_guide, preview_url, is_free, price, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.title, data.description, data.category, data.ai_platform,
      data.prompt_text, data.negative_prompt, data.parameters, data.usage_guide,
      data.preview_url, data.is_free, data.price, 'lexica'
    );

    return { status: 'inserted', title: data.title, category: data.category, source: SOURCE_NAME };
  } catch (err) {
    console.error(`  ❌ 插入失败: ${data.title}`, err.message);
    return { status: 'failed', title: data.title, error: err.message };
  }
}

/**
 * 爬取 Lexica 指定搜索词
 */
async function crawlQuery(query, maxItems = 8) {
  const searchUrl = `${BASE_URL}/?q=${encodeURIComponent(query.q)}`;
  console.log(`  🔍 搜索: "${query.q}"`);

  try {
    const { data: html } = await axios.get(searchUrl, getConfig());
    const items = parseSearchResults(html, query.platform);

    if (items.length === 0) {
      console.log('  📭 未找到结果');
      return { inserted: 0, skipped: 0, failed: 0, items: [] };
    }

    console.log(`  📦 找到 ${items.length} 个结果，将爬取前 ${Math.min(maxItems, items.length)} 个`);

    const results = { inserted: 0, skipped: 0, failed: 0, items: [] };
    let count = 0;

    for (const item of items) {
      if (count >= maxItems) break;

      console.log(`  🔍 解析: ${item.title.substring(0, 50)}...`);
      const detail = await parseDetailPage(item.url, item.title, item.preview, item.platform);

      if (detail) {
        const result = insertTemplate(detail);
        if (result.status === 'inserted') {
          results.inserted++;
          results.items.push(result);
        } else if (result.status === 'skipped') {
          results.skipped++;
        } else {
          results.failed++;
        }
      } else {
        results.failed++;
      }

      count++;
      await randomDelay(1000, 2500);
    }

    return results;
  } catch (err) {
    console.error(`  ❌ 搜索失败: ${query.q}`, err.message);
    return { inserted: 0, skipped: 0, failed: 0, items: [] };
  }
}

/**
 * 主爬取函数
 * @param {Object} options
 * @param {number} options.items - 每个搜索词最多爬取数（默认 6）
 * @param {number} options.maxQueries - 最多爬取多少个搜索词（默认全部）
 */
export async function crawl(options = {}) {
  const itemsPerQuery = options.items || 6;
  const maxQueries = options.maxQueries || SEARCH_QUERIES.length;

  const queriesToCrawl = SEARCH_QUERIES.slice(0, maxQueries);
  const queryLimit = options.category
    ? queriesToCrawl.filter(q => q.weight === options.category)
    : queriesToCrawl;

  if (queryLimit.length === 0) {
    console.log(`\n🤖 Lexica 爬虫: 没有匹配 "${options.category}" 的搜索词`);
    return { total: 0, inserted: 0, skipped: 0, failed: 0, bySource: [], byCategory: [] };
  }

  console.log(`\n🤖 Lexica 爬虫启动`);
  console.log(`📡 搜索词数量: ${queryLimit.length}`);
  console.log(`📄 每词最多: ${itemsPerQuery} 个`);
  console.log('');

  const allResults = { total: 0, inserted: 0, skipped: 0, failed: 0, bySource: [], byCategory: {} };

  for (const query of queryLimit) {
    const qResults = await crawlQuery(query, itemsPerQuery);

    allResults.total += qResults.inserted + qResults.skipped + qResults.failed;
    allResults.inserted += qResults.inserted;
    allResults.skipped += qResults.skipped;
    allResults.failed += qResults.failed;

    qResults.items.forEach(item => {
      if (!allResults.byCategory[item.category]) allResults.byCategory[item.category] = 0;
      allResults.byCategory[item.category]++;
    });

    // 搜索词间等待
    await randomDelay(2000, 4000);
  }

  allResults.bySource = [{ source: SOURCE_NAME, count: allResults.inserted }];
  allResults.byCategory = Object.entries(allResults.byCategory).map(([category, count]) => ({ category, count }));

  return allResults;
}

export default { crawl, name: SOURCE_NAME };
