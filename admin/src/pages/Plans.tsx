import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Trash2 } from 'lucide-react';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    apiProductId: '', name: '', slug: '', description: '', planType: 'TIERED',
    price: 0, requestLimit: 1000, rateLimit: 60, overagePrice: 0, sortOrder: 0,
  });

  useEffect(() => {
    Promise.all([
      api.get('/admin/plans').then(({ data }) => setPlans(data.plans)),
      api.get('/admin/apis').then(({ data }) => setApis(data.apis)),
    ]).then(() => setLoading(false));
  }, []);

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/admin/plans', form);
      const { data } = await api.get('/admin/plans');
      setPlans(data.plans);
      setShowForm(false);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed');
    }
  }

  async function deletePlan(id: string) {
    if (!confirm('Delete this plan?')) return;
    await api.delete(`/admin/plans/${id}`);
    const { data } = await api.get('/admin/plans');
    setPlans(data.plans);
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">
          <Plus size={16} /> Add Plan
        </button>
      </div>

      {showForm && (
        <form onSubmit={createPlan} className="bg-white rounded-xl border p-6 mb-6 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API</label>
              <select value={form.apiProductId} onChange={(e) => setForm({ ...form, apiProductId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Select API</option>
                {apis.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.planType} onChange={(e) => setForm({ ...form, planType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg">
                <option value="FREE">Free</option>
                <option value="TIERED">Tiered</option>
                <option value="PAY_AS_YOU_GO">Pay As You Go</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($/mo)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg" min={0} step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Limit (-1 = unlimited)</label>
              <input type="number" value={form.requestLimit} onChange={(e) => setForm({ ...form, requestLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (req/min)</label>
              <input type="number" value={form.rateLimit} onChange={(e) => setForm({ ...form, rateLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg" min={1} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overage Price ($)</label>
              <input type="number" value={form.overagePrice} onChange={(e) => setForm({ ...form, overagePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg" min={0} step="0.000001" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Create Plan</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">API</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Limit</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rate</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subs</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">{p.apiProduct?.name}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                <td className="px-6 py-4 text-xs"><span className="bg-gray-100 px-2 py-1 rounded">{p.planType}</span></td>
                <td className="px-6 py-4 text-sm">${Number(p.price).toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.requestLimit === -1 ? '∞' : p.requestLimit.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.rateLimit}/min</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p._count?.subscriptions || 0}</td>
                <td className="px-6 py-4">
                  <button onClick={() => deletePlan(p.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
