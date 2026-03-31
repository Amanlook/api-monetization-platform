import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadInvoices(); }, [page, status]);

  async function loadInvoices() {
    setLoading(true);
    const params: any = { page, limit: 20 };
    if (status) params.status = status;
    const { data } = await api.get('/admin/invoices', { params });
    setInvoices(data.invoices);
    setPagination(data.pagination);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Requests</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Overage</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Due</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{inv.id.substring(0, 8)}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{inv.user.name}</p>
                    <p className="text-xs text-gray-500">{inv.user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(inv.periodStart).toLocaleDateString()} — {new Date(inv.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">${Number(inv.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inv.requestCount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inv.overageCount > 0 ? `${inv.overageCount} (+$${Number(inv.overageAmount).toFixed(2)})` : '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      inv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      inv.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{inv.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No invoices found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
