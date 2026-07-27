#!/usr/bin/env node
/**
 * 爬虫 CLI 入口
 * 用法: node src/crawler/run.js [options]
 *
 * 选项:
 *   --source <name>     指定数据源 (prompthero, lexica, all)
 *   --pages <n>         PromptHero 每分类页数 (默认 3)
 *   --items <n>         Lexica 每搜索词项目数 (默认 6)
 *   --max-queries <n>   Lexica 最大搜索词数 (默认全部)
 *   --category <cat>    指定分类
 *   --list              列出可用数据源
 *   --help              显示帮助
 *
 * 示例:
 *   node src/crawler/run.js --source all --pages 2
 *   node src/crawler/run.js --source prompthero --pages 3
 *   node src/crawler/run.js --source lexica --items 8 --max-queries 5
 *   node src/crawler/run.js --source all --category ecommerce
 */
import { crawlSource, crawlAll, getAvailableSources } from './index.js';
import { initDatabase } from '../db/init.js';

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: 'all',
    pages: 3,
    items: 6,
    maxQueries: null,
    category: null,
    list: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--source':
        options.source = args[++i] || 'all';
        break;
      case '--pages':
        options.pages = parseInt(args[++i]) || 3;
        break;
      case '--items':
        options.items = parseInt(args[++i]) || 6;
        break;
      case '--max-queries':
        options.maxQueries = parseInt(args[++i]) || null;
        break;
      case '--category':
        options.category = args[++i] || null;
        break;
      case '--list':
        options.list = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🌐 AI 广告提示词模板站 - 爬虫工具
========================================

用法: node src/crawler/run.js [选项]

选项:
  --source <name>     指定数据源 (prompthero, lexica, all)
  --pages <n>         PromptHero 每分类页数 (默认 3)
  --items <n>         Lexica 每搜索词项目数 (默认 6)
  --max-queries <n>   Lexica 最大搜索词数 (默认全部)
  --category <cat>    指定分类 (ecommerce, social, branding, campaign, marketing, shortvideo)
  --list              列出可用数据源
  --help, -h          显示帮助

示例:
  node src/crawler/run.js --source all --pages 2
  node src/crawler/run.js --source prompthero --pages 3
  node src/crawler/run.js --source lexica --items 8 --max-queries 5
  node src/crawler/run.js --source all --category ecommerce
========================================
  `);
}

function showSources() {
  const sources = getAvailableSources();
  console.log('\n📡 可用数据源:');
  sources.forEach(s => {
    console.log(`  - ${s.id}${s.name !== s.id ? ` (${s.name})` : ''}`);
  });
  console.log('');
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.list) {
    showSources();
    process.exit(0);
  }

  // 初始化数据库
  console.log('📦 初始化数据库...');
  initDatabase();

  const crawlOptions = {
    pages: options.pages,
    items: options.items,
    maxQueries: options.maxQueries,
    category: options.category,
  };

  console.log(`\n========================================`);
  console.log(`🌐 AI 广告提示词模板站 - 爬虫工具`);
  console.log(`========================================`);

  if (options.source === 'all') {
    await crawlAll(undefined, crawlOptions);
  } else {
    await crawlSource(options.source, crawlOptions);
  }

  console.log('✨ 爬取完成！');
}

main().catch(err => {
  console.error('爬虫运行失败:', err);
  process.exit(1);
});
