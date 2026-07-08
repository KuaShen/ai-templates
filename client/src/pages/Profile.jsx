import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Download, Heart, Coins, User, Clock, Calendar, ShoppingBag, Check } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../api/axios';

export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const [downloads, setDownloads] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [checkinMsg, setCheckinMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState('');

  useEffect(() => {
    if (currentTab === 'downloads') {
      api.get('/user/downloads').then(r => setDownloads(r.data.downloads || [])).catch(() => {});
    } else if (currentTab === 'favorites') {
      api.get('/user/favorites').then(r => setFavorites(r.data.templates || [])).catch(() => {});
    } else if (currentTab === 'credits') {
      api.get('/credits/history', { params: { limit: 50 } }).then(r => setTransactions(r.data.transactions || [])).catch(() => {});
    }
  }, [currentTab]);

  const handleCheckin = async () => {
    setLoading(true);
    try {
      const res = await api.post('/credits/checkin');
      setCheckinMsg(res.data.message);
      fetchUser();
    } catch (err) {
      setCheckinMsg(err.response?.data?.error || '签到失败');
    }
    setLoading(false);
    setTimeout(() => setCheckinMsg(''), 3000);
  };

  const handlePurchase = async (pkgId) => {
    setLoading(true);
    try {
      const res = await api.post('/credits/purchase', { package_id: pkgId });
      setPurchaseResult(res.data.message);
      fetchUser();
    } catch (err) {
      setPurchaseResult(err.response?.data?.error || '购买失败');
    }
    setLoading(false);
    setTimeout(() => setPurchaseResult(''), 3000);
  };

  const tabs = [
    { id: 'overview', label: '概览', icon: User },
    { id: 'downloads', label: '下载记录', icon: Download },
    { id: 'favorites', label: '收藏', icon: Heart },
    { id: 'credits', label: '积分', icon: Coins },
  ];

  const packages = [
    { id: 'small', credits: 100, price: 9.99, label: '小试牛刀', unit: '0.10/积分' },
    { id: 'medium', credits: 350, price: 29.99, label: '进阶玩家', unit: '0.086/积分' },
    { id: 'large', credits: 1000, price: 69.99, label: '专业版', unit: '0.07/积分' },
  ];

  return (
    <div className="page-container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{user?.username}</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-amber-600">{user?.credits}</div>
              <div className="text-xs text-gray-400">积分余额</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                currentTab === tab.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {currentTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5 text-center">
              <div className="text-2xl font-bold text-gray-900">{user?.credits}</div>
              <div className="text-sm text-gray-500 mt-1">当前积分</div>
              <button onClick={handleCheckin} disabled={loading} className="btn-primary w-full mt-3 text-sm">
                每日签到 +5 积分
              </button>
              {checkinMsg && (
                <p className="text-xs text-green-600 mt-2">{checkinMsg}</p>
              )}
            </div>
            <div className="card p-5 text-center">
              <div className="text-2xl font-bold text-gray-900">{user?.role === 'admin' ? '管理员' : '普通用户'}</div>
              <div className="text-sm text-gray-500 mt-1">账号角色</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-2xl font-bold text-gray-900">{favorites.length}</div>
              <div className="text-sm text-gray-500 mt-1">收藏模板</div>
              <Link to="/profile?tab=favorites" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block">
                查看收藏
              </Link>
            </div>
          </div>
        )}

        {currentTab === 'downloads' && (
          <div className="card">
            {downloads.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Download className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm">还没有下载记录</p>
                <Link to="/market" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block">
                  去浏览模板
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {downloads.map((d) => (
                  <div key={d.id} className="p-4 flex items-center justify-between">
                    <div>
                      <Link to={`/template/${d.template_id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                        {d.template?.title || d.template_id}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {d.created_at?.slice(0, 10)}
                        {d.credits_spent > 0 && <> · 花费 {d.credits_spent} 积分</>}
                      </p>
                    </div>
                    <span className="text-xs text-green-600 font-medium">{d.credits_spent === 0 ? '免费' : '付费'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'favorites' && (
          <div className="card">
            {favorites.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Heart className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm">还没有收藏模板</p>
                <Link to="/market" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block">
                  去发现好模板
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {favorites.map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0" />
                      <div>
                        <Link to={`/template/${t.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                          {t.title}
                        </Link>
                        <p className="text-xs text-gray-400">{t.category}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${t.is_free ? 'text-green-600' : 'text-amber-600'}`}>
                      {t.is_free ? '免费' : `${t.price} 积分`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'credits' && (
          <div className="space-y-6">
            {/* Purchase Packages */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">购买积分</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="border border-gray-200 rounded-xl p-4 text-center hover:border-primary-200 hover:shadow-sm transition-all">
                    <div className="text-xl font-bold text-gray-900">{pkg.credits}</div>
                    <div className="text-sm text-gray-500">积分</div>
                    <div className="text-xs text-gray-400 mt-1">¥{pkg.price}</div>
                    <div className="text-xs text-gray-400">{pkg.unit}</div>
                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={loading}
                      className="btn-primary w-full mt-3 text-xs"
                    >
                      购买
                    </button>
                  </div>
                ))}
              </div>
              {purchaseResult && (
                <p className="text-sm text-center text-green-600 mt-3 font-medium">{purchaseResult}</p>
              )}
            </div>

            {/* Transaction History */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">积分流水</h3>
              {transactions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">暂无记录</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {transactions.map((t) => (
                    <div key={t.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-800">{t.description || t.type}</p>
                        <p className="text-xs text-gray-400">{t.created_at?.slice(0, 16)}</p>
                      </div>
                      <span className={`text-sm font-medium ${t.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {t.amount > 0 ? '+' : ''}{t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
