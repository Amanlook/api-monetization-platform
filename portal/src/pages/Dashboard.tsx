import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Key, Zap, BarChart3, CreditCard } from 'lucide-react';

export default function Dashboard() {
  const [subs, setSubs] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/portal/subscriptions').then((r) => setSubs(r.data.subscriptions)),
      api.get('/portal/keys').then((r) => setKeys(r.data.keys)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Zap} label="Active Subscriptions" value={subs.filter((s) => s.status === 'ACTIVE').length} color="indigo" />
        <StatCard icon={Key} label="API Keys" value={keys.filter((k) => k.isActive).length} color="green" />
        <StatCard
          icon={BarChart3}
          label="Total Requests"
          value={subs.reduce((s, sub) => s + sub.requestsUsed, 0).toLocaleString()}
          color="blue"
        />
        <StatCard icon={CreditCard} label="Active Plans" value={subs.length} color="purple" />
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <QuickAction to="/apis" title="Browse APIs" desc="Explore available APIs and subscribe" />
        <QuickAction to="/dashboard/keys" title="Manage API Keys" desc="Create and manage your API keys" />
        <QuickAction to="/dashboard/usage" title="View Usage" desc="Monitor your API consumption" />
      </div>

      {/* Active subscriptions */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Subscriptions</h2>
      {subs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No active subscriptions.{' '}
          <Link to="/apis" className="text-indigo-600 hover:underline">
            Browse APIs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map((sub) => (
            <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{sub.plan.apiProduct.name}</h3>
                <p className="text-sm text-gray-500">
                  {sub.plan.name} plan • {sub.requestsUsed.toLocaleString()}{' '}
                  {sub.plan.requestLimit === -1 ? '' : `/ ${sub.plan.requestLimit.toLocaleString()}`} requests
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {sub.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function QuickAction({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </Link>
  );
}
