import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import TemplateCard from '../components/TemplateCard';
import useTemplateStore from '../stores/templateStore';

export default function Market() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const templates = useTemplateStore((s) => s.templates);
  const pagination = useTemplateStore((s) => s.pagination);
  const loading = useTemplateStore((s) => s.loading);
  const fetchTemplates = useTemplateStore((s) => s.fetchTemplates);

  const currentCategory = searchParams.get('category') || '';
  const currentPlatform = searchParams.get('ai_platform') || '';
  const currentPrice = searchParams.get('price_type') || '';
  const currentSort = searchParams.get('sort') || 'latest';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    const params = {};
    if (currentCategory) params.category = currentCategory;
    if (currentPlatform) params.ai_platform = currentPlatform;
    if (currentPrice) params.price_type = currentPrice;
    if (currentSort) params.sort = currentSort;
    if (currentSearch) params.search = currentSearch;
    if (currentPage > 1) params.page = currentPage;
    fetchTemplates(params);
  }, [currentCategory, currentPlatform, currentPrice, currentSort, currentSearch, currentPage]);

  const updateParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});

  const hasFilters = currentCategory || currentPlatform || currentPrice || currentSearch;

  const categories = [
    { id: '', name: '全部' },
    { id: 'ecommerce', name: '🛒 电商广告' },
    { id: 'social', name: '📱 社交媒体' },
    { id: 'branding', name: '🏷️ 品牌形象' },
    { id: 'campaign', name: '🎉 活动推广' },
    { id: 'marketing', name: '📊 营销素材' },
    { id: 'shortvideo', name: '🎬 短视频素材' },
  ];

  const platforms = [
    { id: '', name: '全部平台' },
    { id: 'midjourney', name: 'Midjourney' },
    { id: 'dalle3', name: 'DALL·E 3' },
    { id: 'stable-diffusion', name: 'Stable Diffusion' },
    { id: 'firefly', name: 'Adobe Firefly' },
  ];

  return (
    <div className="page-container py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">模板市场</h1>
        <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary text-sm md:hidden">
          <Filter className="w-4 h-4" /> 筛选
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters - desktop */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-20 space-y-6">
            {/* Search */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={currentSearch}
                  onChange={(e) => updateParams('search', e.target.value)}
                  placeholder="搜索模板..."
                  className="input pl-10 text-sm"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">分类</label>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParams('category', cat.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentCategory === cat.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Platform */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">AI 平台</label>
              <div className="space-y-1">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateParams('ai_platform', p.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentPlatform === p.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">价格</label>
              <div className="space-y-1">
                {[
                  { id: '', name: '全部' },
                  { id: 'free', name: '免费' },
                  { id: 'paid', name: '付费' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateParams('price_type', p.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentPrice === p.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" /> 清除筛选
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {hasFilters && (
                <span className="text-sm text-gray-500">
                  共 {pagination.total} 个结果
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {[
                { id: 'latest', name: '最新' },
                { id: 'popular', name: '最热' },
                { id: 'price_asc', name: '价格 ↑' },
                { id: 'price_desc', name: '价格 ↓' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateParams('sort', s.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    currentSort === s.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile filters */}
          {showFilters && (
            <div className="md:hidden mb-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={currentSearch}
                  onChange={(e) => updateParams('search', e.target.value)}
                  placeholder="搜索模板..."
                  className="input pl-10 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.filter(c => c.id).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParams('category', cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      currentCategory === cat.id
                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {[
                  { id: '', name: '全部' },
                  { id: 'free', name: '🆓 免费' },
                  { id: 'paid', name: '💰 付费' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateParams('price_type', p.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      currentPrice === p.id
                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Template grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-50 rounded w-full" />
                    <div className="flex gap-2">
                      <div className="h-3 bg-gray-50 rounded w-12" />
                      <div className="h-3 bg-gray-50 rounded w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-semibold text-gray-900 mb-2">未找到相关模板</h3>
              <p className="text-sm text-gray-500 mb-4">试试其他关键词或筛选条件</p>
              <button onClick={clearFilters} className="btn-primary">清除筛选</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => updateParams('page', String(currentPage - 1))}
                disabled={currentPage <= 1}
                className="btn-secondary text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> 上一页
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => updateParams('page', String(pageNum))}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => updateParams('page', String(currentPage + 1))}
                disabled={currentPage >= pagination.totalPages}
                className="btn-secondary text-sm"
              >
                下一页 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
