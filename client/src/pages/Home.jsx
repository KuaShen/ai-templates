import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Star } from 'lucide-react';
import TemplateCard from '../components/TemplateCard';
import useTemplateStore from '../stores/templateStore';

export default function Home() {
  const featured = useTemplateStore((s) => s.featured);
  const categories = useTemplateStore((s) => s.categories);
  const fetchFeatured = useTemplateStore((s) => s.fetchFeatured);
  const fetchCategories = useTemplateStore((s) => s.fetchCategories);

  useEffect(() => {
    fetchFeatured();
    fetchCategories();
  }, []);

  const categoryIcons = {
    ecommerce: '🛒',
    social: '📱',
    branding: '🏷️',
    campaign: '🎉',
    marketing: '📊',
    shortvideo: '🎬',
  };

  const categoryNames = {
    ecommerce: '电商广告',
    social: '社交媒体',
    branding: '品牌形象',
    campaign: '活动推广',
    marketing: '营销素材',
    shortvideo: '短视频素材',
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-blue-50 border-b border-gray-100">
        <div className="page-container py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              高质量 AI 广告提示词模板
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              让 AI 生成专业广告素材
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
              经过实测的高质量提示词模板，覆盖电商、社交媒体、品牌营销等场景，即拿即用，稳定出图
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/market" className="btn-primary px-6 py-3 text-base">
                浏览模板 <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/market?price_type=free" className="btn-outline px-6 py-3 text-base">
                免费模板
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 分类导航 */}
      <section className="page-container py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">按分类浏览</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/market?category=${cat.id}`}
              className="card p-4 text-center hover:border-primary-200 hover:shadow-md transition-all group"
            >
              <div className="text-2xl mb-2">{categoryIcons[cat.id] || '📄'}</div>
              <div className="font-medium text-sm text-gray-900 group-hover:text-primary-600 transition-colors">
                {categoryNames[cat.id] || cat.id}
              </div>
              <div className="text-xs text-gray-400 mt-1">{cat.count} 个模板</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 精选模板 */}
      <section className="page-container pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            热门模板
          </h2>
          <Link to="/market" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            查看全部 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </section>

      {/* 特点介绍 */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="page-container py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">经过实测</h3>
              <p className="text-sm text-gray-500">每个模板都经过 AI 平台实测验证，确保出图稳定、效果可控</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">持续更新</h3>
              <p className="text-sm text-gray-500">紧跟各 AI 平台版本更新，随时补充热门场景的最新模板</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">即拿即用</h3>
              <p className="text-sm text-gray-500">完整提示词 + 参数配置 + 使用说明，复制即可在 AI 平台使用</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
