import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function ApisPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadApis(); }, []);

  async function loadApis() {
    const { data } = await api.get('/admin/apis');
    setApis(data.apis);
    setLoading(false);
  }

  async function deleteApi(id: string) {
    if (!confirm('Delete this API and all its plans?')) return;
    await api.delete(`/admin/apis/${id}`);
    loadApis();
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">API Products</h1>
        <Link to="/apis/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">
          <Plus size={16} /> Add API
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Plans</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Requests</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {apis.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{a.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{a.slug}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    a.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                    'bg-red-100 text-red-600'
                  }`}>{a.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{a._count.plans}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{a._count.usageLogs.toLocaleString()}</td>
                <td className="px-6 py-4 flex gap-2 justify-end">
                  <Link to={`/apis/${a.id}/edit`} className="text-gray-400 hover:text-indigo-600"><Edit size={16} /></Link>
                  <button onClick={() => deleteApi(a.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
