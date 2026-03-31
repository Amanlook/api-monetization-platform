import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, [page]);

  async function loadUsers() {
    setLoading(true);
    const { data } = await api.get('/admin/users', { params: { page, limit: 20 } });
    setUsers(data.users);
    setPagination(data.pagination);
    setLoading(false);
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users ({pagination.total})</h1>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subs</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Keys</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.company || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>{u.role}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{u._count.subscriptions}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{u._count.apiKeys}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-600">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page >= pagination.pages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
