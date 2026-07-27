/**
 * PromptHero 爬虫
 * 来源: https://prompthero.com/
 * 爬取提示词模板数据并存入数据库
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../../db/init.js';
import { randomUA, randomDelay, mapPlatform, mapCategory, generateId, isDuplicate, extractSource } from '../utils.js';

const SOURCE_NAME = 'prompthero';
const BASE_URL = 'https://prompthero.com';

// 要爬取的分类页面
const CATEGORY_PAGES = [
  { url: '/midjourney-prompts', platform: 'midjourney' },
  { url: '/dalle-prompts', platform: 'dalle3' },
  { url: '/stable-diffusion-prompts', platform: 'stable-diffusion' },
];

/**
 * 获取列表页的请求配置
 */
function getConfig() {
  return {
    headers: {
      'User-Agent': randomUA(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      'Referer': BASE_URL,
    },
    timeout: 15000,
  };
}

/**
 * 从列表页解析模板卡片列表
 * @param {string} html - HTML 内容
 * @param {string} platform - AI 平台标识
 * @returns {Array<{url:string, title:string, preview:string}>}
 */
function parseListPage(html, platform) {
  const $ = cheerio.load(html);
  const items = [];

  // PromptHero 的列表页卡片结构
  $('a[href*="/prompt/"]').each((i, el) => {
    const href = $(el).attr('href');
    const title = $(el).find('h2, h3, .prompt-title, .card-title').first().text().trim();
    const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
    const preview = img.startsWith('http') ? img : (img ? BASE_URL + img : '');

    if (href && title) {
      const url = href.startsWith('http') ? href : BASE_URL + href;
      // 简单去重：不要重复 URL
      if (!items.some(i => i.url === url)) {
        items.push({ url, title, preview, platform });
      }
    }
  });

  return items;
}

/**
 * 从详情页解析完整模板数据
 * @param {string} url - 详情页 URL
 * @param {string} title - 标题
 * @param {string} preview - 预览图
 * @param {string} platform - AI 平台
 * @returns {Object|null} 模板数据或 null
 */
async function parseDetailPage(url, title, preview, platform) {
  try {
    const { data: html } = await axios.get(url, getConfig());
    const $ = cheerio.load(html);

    // 提取完整提示词
    let promptText = '';
    $('textarea, code, .prompt-text, .prompt-content, [class*="prompt"]').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20 && text.length > promptText.length) {
        promptText = text;
      }
    });

    // 备选：从页面 meta 或特定区域提取
    if (!promptText) {
      const metaPrompt = $('meta[name="description"]').attr('content') || '';
      if (metaPrompt.length > 30) promptText = metaPrompt;
    }

    if (!promptText || promptText.length < 10) {
      // 有时提示词在 script 标签的 JSON 数据中
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const data = JSON.parse($(el).html() || '{}');
          if (data.description && data.description.length > 20) {
            promptText = data.description;
          }
        } catch {}
      });
    }

    if (!promptText || promptText.length < 10) {
      console.warn(`  ⚠️ 无法提取提示词: ${title}`);
      return null;
    }

    // 提取描述
    let description = $('meta[name="description"]').attr('content') || '';
    if (!description || description.length < 5) {
      description = $(`p:contains("${title.substring(0, 10)}")`).first().text().trim();
    }
    if (!description || description.length < 5) {
      description = title;
    }
    description = description.substring(0, 200);

    // 提取反向提示词
    let negativePrompt = '';
    // 查找 negative prompt 相关区域
    $('[class*="negative"], [class*="neg"], .neg-prompt').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 5) negativePrompt = text;
    });

    // 提取参数
    const parameters = {};
    const paramLines = $('[class*="param"], [class*="setting"], [class*="info"] li, .parameters p').map((i, el) => $(el).text().trim()).get();
    paramLines.forEach(line => {
      const parts = line.split(/[:：]/);
      if (parts.length === 2) {
        const key = parts[0].trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        parameters[key] = parts[1].trim();
      }
    });

    // 从提示词文本中解析 MJ 参数（--ar, --v, --s 等）
    if (platform === 'midjourney' && promptText) {
      const arMatch = promptText.match(/--ar\s+([\d:]+)/);
      if (arMatch) parameters.aspect = arMatch[1];
      const sMatch = promptText.match(/--s\s+(\d+)/);
      if (sMatch) parameters.stylize = parseInt(sMatch[1]);
      const vMatch = promptText.match(/--v\s+([\d.]+)/);
      if (vMatch) parameters.version = vMatch[1];
    }

    // 生成使用指南
    const platformName = platform === 'midjourney' ? 'Midjourney' :
                         platform === 'dalle3' ? 'DALL·E 3' :
                         platform === 'stable-diffusion' ? 'Stable Diffusion' :
                         platform;
    const usageGuide = `此模板适用于 ${platformName}。将提示词复制到 ${platformName} 中即可生成对应效果的图片。如需调整，可以修改主体描述、颜色或构图等关键词。`;

    // 确定分类
    const category = mapCategory(title + ' ' + description);

    return {
      title: title.substring(0, 100),
      description: description.substring(0, 200),
      category,
      ai_platform: platform,
      prompt_text: promptText,
      negative_prompt: negativePrompt,
      parameters: JSON.stringify(parameters),
      usage_guide: usageGuide,
      preview_url: preview,
      is_free: 0,
      price: Math.floor(Math.random() * 4) ? 5 : 3, // 随机定价
      source_url: url,
    };
  } catch (err) {
    console.error(`  ❌ 解析详情页失败: ${url}`, err.message);
    return null;
  }
}

/**
 * 插入模板到数据库（带去重）
 */
function insertTemplate(data) {
  try {
    if (isDuplicate(db, data.title)) {
      return { status: 'skipped', title: data.title };
    }

    const id = generateId('ph', Math.floor(Math.random() * 10000));

    db.prepare(`
      INSERT INTO templates (id, title, description, category, ai_platform, prompt_text, negative_prompt, parameters, usage_guide, preview_url, is_free, price, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.title, data.description, data.category, data.ai_platform,
      data.prompt_text, data.negative_prompt, data.parameters, data.usage_guide,
      data.preview_url, data.is_free, data.price, 'prompthero'
    );

    return { status: 'inserted', title: data.title, category: data.category, source: SOURCE_NAME };
  } catch (err) {
    console.error(`  ❌ 插入数据库失败: ${data.title}`, err.message);
    return { status: 'failed', title: data.title, error: err.message };
  }
}

/**
 * 爬取 PromptHero 指定分类页
 * @param {Object} category - { url, platform }
 * @param {number} maxPages - 最大爬取页数
 */
async function crawlCategory(category, maxPages = 3) {
  const results = { inserted: 0, skipped: 0, failed: 0, items: [] };
  let processedCount = 0;
  const maxItems = maxPages * 12; // 每页约 12 条

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = `${BASE_URL}${category.url}?page=${page}`;
    console.log(`  📄 列表页 ${page}: ${pageUrl}`);

    try {
      const { data: html } = await axios.get(pageUrl, getConfig());
      const items = parseListPage(html, category.platform);

      if (items.length === 0) {
        console.log('  📭 无更多数据，停止翻页');
        break;
      }

      console.log(`  📦 找到 ${items.length} 个模板`);

      for (const item of items) {
        if (processedCount >= maxItems) break;

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

        processedCount++;
        await randomDelay(1500, 3500); // 请求间隔，避免被封
      }
    } catch (err) {
      console.error(`  ❌ 列表页抓取失败: ${pageUrl}`, err.message);
      continue;
    }
  }

  return results;
}

/**
 * 主爬取函数
 * @param {Object} options
 * @param {number} options.pages - 每个分类爬取多少页（默认 3）
 * @param {string} options.category - 指定分类（可选，默认爬全部）
 */
export async function crawl(options = {}) {
  const pages = options.pages || 3;
  const categoryFilter = options.category;

  const categoriesToCrawl = categoryFilter
    ? CATEGORY_PAGES.filter(c => c.platform === categoryFilter || c.url.includes(categoryFilter))
    : CATEGORY_PAGES;

  console.log(`\n🤖 PromptHero 爬虫启动`);
  console.log(`📡 目标分类: ${categoriesToCrawl.map(c => c.platform).join(', ')}`);
  console.log(`📄 每分类页数: ${pages}`);
  console.log('');

  const allResults = { total: 0, inserted: 0, skipped: 0, failed: 0, bySource: [], byCategory: {} };

  for (const cat of categoriesToCrawl) {
    console.log(`\n===== 爬取分类: ${cat.platform} =====`);
    const catResults = await crawlCategory(cat, pages);

    allResults.total += catResults.inserted + catResults.skipped + catResults.failed;
    allResults.inserted += catResults.inserted;
    allResults.skipped += catResults.skipped;
    allResults.failed += catResults.failed;

    catResults.items.forEach(item => {
      if (!allResults.byCategory[item.category]) allResults.byCategory[item.category] = 0;
      allResults.byCategory[item.category]++;
    });

    // 分类间等待
    await randomDelay(2000, 4000);
  }

  allResults.bySource = [{ source: SOURCE_NAME, count: allResults.inserted }];
  allResults.byCategory = Object.entries(allResults.byCategory).map(([category, count]) => ({ category, count }));

  return allResults;
}

export default { crawl, name: SOURCE_NAME };
