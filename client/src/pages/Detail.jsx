import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Download, Heart, ArrowLeft, Coins, Check, ImageIcon, ExternalLink, Sparkles } from 'lucide-react';
import useTemplateStore from '../stores/templateStore';
import useAuthStore from '../stores/authStore';

const platformLabels = {
  midjourney: { name: 'Midjourney', url: 'https://www.midjourney.com' },
  dalle3: { name: 'DALL·E 3', url: 'https://chatgpt.com' },
  'stable-diffusion': { name: 'Stable Diffusion', url: 'https://stability.ai' },
  firefly: { name: 'Adobe Firefly', url: 'https://firefly.adobe.com' },
};

const categoryNames = {
  ecommerce: '电商广告',
  social: '社交媒体',
  branding: '品牌形象',
  campaign: '活动推广',
  marketing: '营销素材',
  shortvideo: '短视频素材',
};

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [imgError, setImgError] = useState(false);
  const { currentTemplate: template, isFavorited, loading, fetchTemplate, downloadTemplate, toggleFavorite, clearCurrent } = useTemplateStore();
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    fetchTemplate(id);
    return () => clearCurrent();
  }, [id]);

  const handleCopy = async () => {
    if (!downloadResult?.success && !template.is_free) {
      return;
    }
    try {
      await navigator.clipboard.writeText(template.prompt_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleDownload = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setDownloading(true);
    try {
      const result = await downloadTemplate(template.id);
      setDownloadResult(result);
      fetchUser();
    } catch (err) {
      setDownloadResult({ error: err.error || '下载失败' });
    }
    setDownloading(false);
  };

  if (loading || !template) {
    return (
      <div className="page-container py-16">
        <div className="animate-pulse max-w-4xl mx-auto space-y-6">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="aspect-[16/9] bg-gray-100 rounded-xl" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-50 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  let params = {};
  try {
    params = typeof template.parameters === 'string' ? JSON.parse(template.parameters) : (template.parameters || {});
  } catch { params = {}; }

  const showPrompt = downloadResult?.success || template.is_free;

  return (
    <div className="page-container py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left - Preview */}
          <div className="lg:col-span-3 space-y-6">
            <div className="card overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                {!imgError ? (
                  <img
                    src={template.preview_url}
                    alt={template.title}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-16 h-16 mb-3" />
                    <span className="text-sm">预览图待生成 - 请先下载提示词</span>
                  </div>
                )}
              </div>
            </div>

            {/* Prompt Text */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  提示词内容
                </h3>
                {showPrompt && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                )}
              </div>
              <div className="p-5">
                {showPrompt ? (
                  <div>
                    <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">{template.prompt_text}</pre>
                    {template.negative_prompt && (
                      <div className="mt-4">
                        <div className="text-xs text-gray-500 mb-1 font-medium">反向提示词 (Negative Prompt):</div>
                        <pre className="bg-red-50 rounded-lg p-3 text-sm text-gray-700 font-mono leading-relaxed whitespace-pre-wrap">{template.negative_prompt}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-3xl mb-3">🔒</div>
                    <p className="text-sm mb-2">付费模板，下载后查看完整提示词</p>
                    <p className="text-xs">花费 {template.price} 积分即可解锁</p>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Guide */}
            {template.usage_guide && showPrompt && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-2">使用说明</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{template.usage_guide}</p>
              </div>
            )}
          </div>

          {/* Right - Info */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="text-xl font-bold text-gray-900">{template.title}</h1>
                {user && (
                  <button
                    onClick={() => toggleFavorite(template.id)}
                    className={`p-2 rounded-lg transition-colors shrink-0 ${isFavorited ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-400 hover:bg-red-50'}`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="badge-blue">{categoryNames[template.category] || template.category}</span>
                {template.is_free ? (
                  <span className="badge-green">免费</span>
                ) : (
                  <span className="badge-orange flex items-center gap-1"><Coins className="w-3 h-3" />{template.price} 积分</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>下载 {template.downloads}</span>
              <span>收藏 {template.likes}</span>
            </div>

            {/* AI Platform */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">AI 平台</div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{platformLabels[template.ai_platform]?.name || template.ai_platform}</span>
                <a href={platformLabels[template.ai_platform]?.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  前往使用 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Parameters */}
            {Object.keys(params).length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-2">参数配置</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(params).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">{key}:</span>
                      <span className="text-sm font-medium text-gray-800">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download Button */}
            <div className="pt-2">
              {downloadResult?.success ? (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                    <Check className="w-5 h-5" /> 下载成功！
                  </div>
                  <p className="text-sm text-green-600">提示词已解锁，复制或查看完整内容</p>
                </div>
              ) : downloadResult?.error ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-3">
                  <p className="text-sm text-red-600">{downloadResult.error}</p>
                  {downloadResult.need_credits > 0 && (
                    <button onClick={() => navigate('/profile')} className="text-sm text-red-600 font-medium mt-1 hover:underline">
                      前往充值
                    </button>
                  )}
                </div>
              ) : null}

              <button
                onClick={handleDownload}
                disabled={downloading || downloadResult?.success}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  downloadResult?.success
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : template.is_free
                    ? 'btn-primary'
                    : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400'
                }`}
              >
                {downloading ? (
                  '处理中...'
                ) : downloadResult?.success ? (
                  ' 已下载'
                ) : template.is_free ? (
                  <><Download className="w-4 h-4" /> 免费下载</>
                ) : (
                  <><Coins className="w-4 h-4" /> 花费 {template.price} 积分下载</>
                )}
              </button>
              {!user && (
                <p className="text-xs text-gray-400 text-center mt-2">登录后可下载提示词模板</p>
              )}

              {downloadResult?.success && (
                <p className="text-xs text-gray-400 text-center mt-1">
                  {!template.is_free && `消费 ${template.price} 积分`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
