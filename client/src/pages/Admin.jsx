import { useEffect, useState } from 'react';
import {
  LayoutDashboard, FileText, Users, Plus, Edit2, Trash2, X,
  Bot, Play, RefreshCw, CheckCircle2, XCircle, Clock, Database, AlertCircle
} from 'lucide-react';
import api from '../api/axios';

export default function Admin() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', category: 'ecommerce', ai_platform: 'midjourney',
    prompt_text: '', negative_prompt: '', parameters: '', usage_guide: '', is_free: false, price: 5,
  });
  const [loading, setLoading] = useState(false);

  // 爬虫状态
  const [crawlerStatus, setCrawlerStatus] = useState(null);
  const [crawlerSources, setCrawlerSources] = useState([]);
  const [crawlerRunning, setCrawlerRunning] = useState(false);
  const [crawlerOptions, setCrawlerOptions] = useState({
    source: 'all',
    pages: 2,
    items: 6,
    category: '',
  });
  const [crawlerPolling, setCrawlerPolling] = useState(null);

  useEffect(() => {
    if (tab === 'dashboard') {
      api.get('/admin/stats').then(r => setStats(r.data.stats)).catch(() => {});
    } else if (tab === 'templates') {
      api.get('/admin/templates').then(r => setTemplates(r.data.templates)).catch(() => {});
    } else if (tab === 'users') {
      api.get('/admin/users').then(r => setUsers(r.data.users)).catch(() => {});
    } else if (tab === 'crawler') {
      loadCrawlerStatus();
      loadCrawlerSources();
    }
  }, [tab]);

  // 停止轮询
  useEffect(() => {
    return () => {
      if (crawlerPolling) clearInterval(crawlerPolling);
    };
  }, [crawlerPolling]);

  const loadCrawlerStatus = async () => {
    try {
      const r = await api.get('/admin/crawler/status');
      setCrawlerStatus(r.data);
      if (r.data.running) {
        setCrawlerRunning(true);
        startPolling();
      } else {
        setCrawlerRunning(false);
        if (crawlerPolling) {
          clearInterval(crawlerPolling);
          setCrawlerPolling(null);
        }
      }
    } catch {}
  };

  const loadCrawlerSources = async () => {
    try {
      const r = await api.get('/admin/crawler/sources');
      setCrawlerSources(r.data.sources);
    } catch {}
  };

  const startPolling = () => {
    if (crawlerPolling) clearInterval(crawlerPolling);
    const id = setInterval(async () => {
      try {
        const r = await api.get('/admin/crawler/status');
        setCrawlerStatus(r.data);
        if (!r.data.running) {
          setCrawlerRunning(false);
          clearInterval(id);
          setCrawlerPolling(null);
        }
      } catch {}
    }, 3000);
    setCrawlerPolling(id);
  };

  const handleStartCrawler = async () => {
    setCrawlerRunning(true);
    try {
      const body = {
        source: crawlerOptions.source,
        pages: parseInt(crawlerOptions.pages) || 2,
        items: parseInt(crawlerOptions.items) || 6,
      };
      if (crawlerOptions.category) body.category = crawlerOptions.category;

      await api.post('/admin/crawler/run', body);
      startPolling();
    } catch (err) {
      alert(err.response?.data?.error || '启动爬虫失败');
      setCrawlerRunning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/admin/templates/${editId}`, form);
      } else {
        await api.post('/admin/templates', form);
      }
      setShowModal(false);
      setEditId(null);
      setForm({ title: '', description: '', category: 'ecommerce', ai_platform: 'midjourney', prompt_text: '', negative_prompt: '', parameters: '', usage_guide: '', is_free: false, price: 5 });
      api.get('/admin/templates').then(r => setTemplates(r.data.templates)).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
    setLoading(false);
  };

  const handleEdit = (t) => {
    setEditId(t.id);
    setForm({
      title: t.title, description: t.description || '', category: t.category, ai_platform: t.ai_platform,
      prompt_text: t.prompt_text, negative_prompt: t.negative_prompt || '', parameters: t.parameters || '',
      usage_guide: t.usage_guide || '', is_free: !!t.is_free, price: t.price,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个模板吗？')) return;
    try {
      await api.delete(`/admin/templates/${id}`);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) {
      alert('删除失败');
    }
  };

  const tabs = [
    { id: 'dashboard', label: '数据概览', icon: LayoutDashboard },
    { id: 'templates', label: '模板管理', icon: FileText },
    { id: 'crawler', label: '爬虫管理', icon: Bot },
    { id: 'users', label: '用户管理', icon: Users },
  ];

  return (
    <div className="page-container py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">管理后台</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-5"><div className="text-2xl font-bold">{stats.totalTemplates}</div><div className="text-sm text-gray-500">模板总数</div></div>
              <div className="card p-5"><div className="text-2xl font-bold">{stats.totalUsers}</div><div className="text-sm text-gray-500">用户总数</div></div>
              <div className="card p-5"><div className="text-2xl font-bold">{stats.totalDownloads}</div><div className="text-sm text-gray-500">下载次数</div></div>
              <div className="card p-5"><div className="text-2xl font-bold">{stats.totalRevenue}</div><div className="text-sm text-gray-500">积分消耗</div></div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold mb-3">分类分布</h3>
              <div className="space-y-2">
                {stats.categoryStats?.map(c => (
                  <div key={c.category} className="flex items-center gap-3">
                    <span className="text-sm w-20">{c.category}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{width: `${(c.count / stats.totalTemplates * 100)}%`}} />
                    </div>
                    <span className="text-sm text-gray-500">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Templates Management */}
        {tab === 'templates' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => { setEditId(null); setForm({ title: '', description: '', category: 'ecommerce', ai_platform: 'midjourney', prompt_text: '', negative_prompt: '', parameters: '', usage_guide: '', is_free: false, price: 5 }); setShowModal(true); }} className="btn-primary">
                <Plus className="w-4 h-4" /> 新增模板
              </button>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">标题</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">分类</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">平台</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">价格</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {templates.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{t.title}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{t.category}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{t.ai_platform}</td>
                      <td className="px-4 py-3">{t.is_free ? <span className="text-green-600">免费</span> : `${t.price} 积分`}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleEdit(t)} className="p-1.5 text-gray-400 hover:text-primary-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Crawler Management */}
        {tab === 'crawler' && (
          <div className="space-y-6">
            {/* 数据库概览 */}
            {crawlerStatus && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-900">数据库概况</h3>
                </div>
                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{crawlerStatus.database?.totalTemplates || 0}</div>
                    <div className="text-sm text-gray-500">模板总数</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {crawlerStatus.database?.categoryStats?.map(c => (
                        <span key={c.category} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-full text-xs text-gray-600">
                          {c.category}: {c.count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 爬虫控制面板 */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">爬虫控制</h3>
              </div>

              {/* 运行状态 */}
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-50">
                {crawlerRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-primary-600 animate-spin" />
                    <span className="text-sm text-primary-700 font-medium">爬虫正在运行中...</span>
                  </>
                ) : crawlerStatus?.lastRun ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600">
                      上次运行: {new Date(crawlerStatus.lastRun).toLocaleString('zh-CN')}
                      {crawlerStatus.lastResult && ` — 插入 ${crawlerStatus.lastResult.inserted} 条，跳过 ${crawlerStatus.lastResult.skipped} 条`}
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">尚未运行过爬虫</span>
                  </>
                )}
              </div>

              {/* 错误显示 */}
              {crawlerStatus?.error && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {crawlerStatus.error}
                </div>
              )}

              {/* 配置表单 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">数据源</label>
                  <select
                    value={crawlerOptions.source}
                    onChange={e => setCrawlerOptions({...crawlerOptions, source: e.target.value})}
                    className="input text-sm"
                    disabled={crawlerRunning}
                  >
                    <option value="all">全部数据源</option>
                    {crawlerSources.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">每分类页数</label>
                  <input
                    type="number"
                    value={crawlerOptions.pages}
                    onChange={e => setCrawlerOptions({...crawlerOptions, pages: e.target.value})}
                    className="input text-sm"
                    min={1} max={10}
                    disabled={crawlerRunning}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">每词条数</label>
                  <input
                    type="number"
                    value={crawlerOptions.items}
                    onChange={e => setCrawlerOptions({...crawlerOptions, items: e.target.value})}
                    className="input text-sm"
                    min={1} max={20}
                    disabled={crawlerRunning}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">指定分类</label>
                  <select
                    value={crawlerOptions.category}
                    onChange={e => setCrawlerOptions({...crawlerOptions, category: e.target.value})}
                    className="input text-sm"
                    disabled={crawlerRunning}
                  >
                    <option value="">全部分类</option>
                    <option value="ecommerce">电商广告</option>
                    <option value="social">社交媒体</option>
                    <option value="branding">品牌形象</option>
                    <option value="campaign">活动推广</option>
                    <option value="marketing">营销素材</option>
                    <option value="shortvideo">短视频素材</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleStartCrawler}
                disabled={crawlerRunning}
                className="btn-primary"
              >
                {crawlerRunning ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> 运行中...</>
                ) : (
                  <><Play className="w-4 h-4" /> 启动爬虫</>
                )}
              </button>
            </div>

            {/* 上次运行结果 */}
            {crawlerStatus?.lastResult && !crawlerRunning && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4">上次运行结果</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-green-50">
                    <div className="text-xl font-bold text-green-700">{crawlerStatus.lastResult.inserted || 0}</div>
                    <div className="text-xs text-green-600">成功插入</div>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50">
                    <div className="text-xl font-bold text-yellow-700">{crawlerStatus.lastResult.skipped || 0}</div>
                    <div className="text-xs text-yellow-600">跳过(重复)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50">
                    <div className="text-xl font-bold text-red-700">{crawlerStatus.lastResult.failed || 0}</div>
                    <div className="text-xs text-red-600">失败</div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <div className="text-xl font-bold text-blue-700">{crawlerStatus.lastResult.elapsed || '--'}</div>
                    <div className="text-xs text-blue-600">耗时(秒)</div>
                  </div>
                </div>

                {crawlerStatus.lastResult.bySource && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">按来源:</h4>
                    <div className="flex flex-wrap gap-2">
                      {crawlerStatus.lastResult.bySource.map(s => (
                        <span key={s.source} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-full text-sm text-gray-600">
                          {s.source}: {s.count} 条
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {crawlerStatus.lastResult.byCategory && crawlerStatus.lastResult.byCategory.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">按分类:</h4>
                    <div className="flex flex-wrap gap-2">
                      {crawlerStatus.lastResult.byCategory.map(c => (
                        <span key={c.category} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-full text-sm text-gray-600">
                          {c.category}: {c.count} 条
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">用户名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">邮箱</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">积分</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">角色</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">注册时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">{u.credits}</td>
                    <td className="px-4 py-3"><span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span></td>
                    <td className="px-4 py-3 text-gray-500">{u.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center pt-16">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editId ? '编辑模板' : '新增模板'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">标题 *</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input" required />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">描述</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input" rows={2} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">分类</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input">
                    <option value="ecommerce">电商广告</option>
                    <option value="social">社交媒体</option>
                    <option value="branding">品牌形象</option>
                    <option value="campaign">活动推广</option>
                    <option value="marketing">营销素材</option>
                    <option value="shortvideo">短视频素材</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">AI平台</label>
                  <select value={form.ai_platform} onChange={e => setForm({...form, ai_platform: e.target.value})} className="input">
                    <option value="midjourney">Midjourney</option>
                    <option value="dalle3">DALL·E 3</option>
                    <option value="stable-diffusion">Stable Diffusion</option>
                    <option value="firefly">Adobe Firefly</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">提示词 *</label>
                  <textarea value={form.prompt_text} onChange={e => setForm({...form, prompt_text: e.target.value})} className="input font-mono text-xs" rows={4} required />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">反向提示词</label>
                  <textarea value={form.negative_prompt} onChange={e => setForm({...form, negative_prompt: e.target.value})} className="input font-mono text-xs" rows={2} />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">参数 (JSON)</label>
                  <input value={form.parameters} onChange={e => setForm({...form, parameters: e.target.value})} className="input" placeholder='{"aspect":"4:3","version":"6.1"}' />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">使用说明</label>
                  <textarea value={form.usage_guide} onChange={e => setForm({...form, usage_guide: e.target.value})} className="input" rows={2} />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.is_free} onChange={e => setForm({...form, is_free: e.target.checked})} className="rounded" />
                    <span className="text-sm text-gray-700">免费模板</span>
                  </label>
                  {!form.is_free && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700">价格:</label>
                      <input type="number" value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value) || 0})} className="input w-20" min={0} />
                      <span className="text-sm text-gray-500">积分</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? '保存中...' : (editId ? '保存' : '创建')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
