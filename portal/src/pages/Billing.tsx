import { useEffect, useState } from 'react';
import api from '../lib/api';
import { CreditCard, Download, Clock } from 'lucide-react';

export default function Billing() {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portal/billing').then(({ data }) => {
      setBilling(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing</h1>
      <p className="text-gray-600 mb-8">View your invoices and payment history</p>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-3xl font-bold text-gray-900">${Number(billing?.totalSpent || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Active Subscriptions</p>
          <p className="text-3xl font-bold text-gray-900">{billing?.subscriptions?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Pending Invoices</p>
          <p className="text-3xl font-bold text-gray-900">
            {billing?.invoices?.filter((i: any) => i.status === 'PENDING').length || 0}
          </p>
        </div>
      </div>

      {/* Current spending */}
      {billing?.subscriptions?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Period Usage</h2>
          <div className="space-y-4">
            {billing.subscriptions.map((sub: any) => (
              <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{sub.api}</h3>
                    <p className="text-sm text-gray-500">{sub.plan} plan • ${sub.price}/mo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {sub.requestsUsed.toLocaleString()}{' '}
                      {sub.requestLimit !== -1 && `/ ${sub.requestLimit.toLocaleString()}`} requests
                    </p>
                    <p className="text-xs text-gray-400">
                      Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {sub.requestLimit !== -1 && (
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, sub.usagePercent)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice History</h2>
      {billing?.invoices?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No invoices yet
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Requests</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Due</th>
              </tr>
            </thead>
            <tbody>
              {billing?.invoices?.map((inv: any) => (
                <tr key={inv.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{inv.id.substring(0, 8)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(inv.periodStart).toLocaleDateString()} - {new Date(inv.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${Number(inv.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inv.requestCount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        inv.status === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : inv.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
