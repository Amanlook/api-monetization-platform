import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Zap, XCircle } from 'lucide-react';

export default function Subscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubs();
  }, []);

  async function loadSubs() {
    const { data } = await api.get('/portal/subscriptions');
    setSubs(data.subscriptions);
    setLoading(false);
  }

  async function cancelSub(id: string) {
    if (!confirm('Cancel this subscription?')) return;
    await api.delete(`/portal/subscriptions/${id}`);
    loadSubs();
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscriptions</h1>
      <p className="text-gray-600 mb-8">Manage your API subscriptions</p>

      {subs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No subscriptions yet.
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map((sub) => (
            <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{sub.plan.apiProduct.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{sub.plan.name} plan</p>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className={`text-sm font-medium ${sub.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'}`}>
                          {sub.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-sm font-medium text-gray-900">
                          ${sub.plan.price}/{sub.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Requests Used</p>
                        <p className="text-sm font-medium text-gray-900">
                          {sub.requestsUsed.toLocaleString()}
                          {sub.plan.requestLimit !== -1 && ` / ${sub.plan.requestLimit.toLocaleString()}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Renews</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {/* Usage bar */}
                    {sub.plan.requestLimit !== -1 && (
                      <div className="mt-3 w-full max-w-xs">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sub.requestsUsed / sub.plan.requestLimit > 0.9
                                ? 'bg-red-500'
                                : sub.requestsUsed / sub.plan.requestLimit > 0.7
                                ? 'bg-yellow-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (sub.requestsUsed / sub.plan.requestLimit) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {sub.status === 'ACTIVE' && (
                  <button
                    onClick={() => cancelSub(sub.id)}
                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition"
                  >
                    <XCircle size={16} />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
