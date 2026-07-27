/**
 * 爬虫调度器
 * 统一管理多数据源的爬虫任务
 */
import db from '../db/init.js';
import { printStats } from './utils.js';

// 导入各数据源爬虫
import prompthero from './sources/prompthero.js';
import lexica from './sources/lexica.js';

// 已注册的数据源
const SOURCES = {
  prompthero,
  lexica,
};

const SOURCE_NAMES = Object.keys(SOURCES);

/**
 * 获取可用的数据源列表
 */
export function getAvailableSources() {
  return SOURCE_NAMES.map(name => ({
    id: name,
    name: SOURCES[name].name || name,
  }));
}

/**
 * 运行单个数据源的爬虫
 * @param {string} sourceName - 数据源标识
 * @param {Object} options - 爬取选项
 * @param {number} options.pages - 每分类页数 (PromptHero)
 * @param {number} options.items - 每搜索词项目数 (Lexica)
 * @param {string} options.category - 指定分类
 */
export async function crawlSource(sourceName, options = {}) {
  const source = SOURCES[sourceName];
  if (!source) {
    throw new Error(`未知数据源: ${sourceName}，可用: ${SOURCE_NAMES.join(', ')}`);
  }

  console.log(`\n🔥 启动爬虫: ${source.name || sourceName}`);
  const startTime = Date.now();

  const results = await source.crawl(options);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  results.elapsed = elapsed;

  console.log(`✅ 爬虫 ${source.name || sourceName} 完成 (耗时: ${elapsed}s)`);
  printStats(results);

  return results;
}

/**
 * 运行多个/全部数据源的爬虫
 * @param {string[]} sources - 数据源列表（默认全部）
 * @param {Object} options - 爬取选项
 */
export async function crawlAll(sources = SOURCE_NAMES, options = {}) {
  const aggregated = {
    total: 0, inserted: 0, skipped: 0, failed: 0,
    bySource: [], byCategory: {},
  };

  console.log(`\n🚀 批量爬虫启动 - 数据源: ${sources.join(', ')}`);
  console.log(`⏰ 开始时间: ${new Date().toISOString()}`);
  console.log('');

  for (const sourceName of sources) {
    try {
      const results = await crawlSource(sourceName, options);

      aggregated.total += results.total || 0;
      aggregated.inserted += results.inserted || 0;
      aggregated.skipped += results.skipped || 0;
      aggregated.failed += results.failed || 0;

      if (results.bySource) {
        aggregated.bySource.push(...results.bySource);
      }

      if (results.byCategory) {
        results.byCategory.forEach(c => {
          aggregated.byCategory[c.category] = (aggregated.byCategory[c.category] || 0) + c.count;
        });
      }
    } catch (err) {
      console.error(`❌ 数据源 ${sourceName} 爬取失败:`, err.message);
    }
  }

  aggregated.byCategory = Object.entries(aggregated.byCategory).map(([category, count]) => ({ category, count }));

  console.log(`\n🏁 全部爬虫完成`);
  printStats(aggregated);

  return aggregated;
}

export default { crawlSource, crawlAll, getAvailableSources };
