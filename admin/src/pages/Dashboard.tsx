import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Users, Package, Zap, DollarSign, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => { setStats(data); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  const cards = [
    { label: 'Total Developers', value: stats.stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Active APIs', value: stats.stats.totalApis, icon: Package, color: 'bg-green-500' },
    { label: 'Active Subs', value: stats.stats.totalSubscriptions, icon: Zap, color: 'bg-purple-500' },
    { label: 'Total Revenue', value: `$${Number(stats.stats.totalRevenue).toFixed(0)}`, icon: DollarSign, color: 'bg-yellow-500' },
    { label: 'Requests (24h)', value: stats.stats.requestsLast24h.toLocaleString(), icon: Activity, color: 'bg-red-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center`}>
                <c.icon size={16} className="text-white" />
              </div>
              <span className="text-xs text-gray-500">{c.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Recent signups */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Signups</h2>
        <div className="space-y-3">
          {stats.recentSignups.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
              <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
