import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/auth';
import { Check, Zap, ArrowRight } from 'lucide-react';

export default function ApiDetail() {
  const { slug } = useParams();
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    loadApi();
  }, [slug]);

  async function loadApi() {
    try {
      const { data } = await api.get(`/portal/apis/${slug}`);
      setApiData(data.api);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function subscribe(planId: string) {
    if (!user) return navigate('/login');
    setSubscribing(planId);
    try {
      await api.post('/portal/subscriptions', { planId });
      alert('Subscribed successfully!');
      navigate('/dashboard/subscriptions');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Subscription failed');
    }
    setSubscribing(null);
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;
  if (!apiData) return <div className="text-center py-20 text-gray-500">API not found</div>;

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-2xl flex-shrink-0">
            {apiData.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{apiData.name}</h1>
            <p className="text-gray-600 mt-2">{apiData.description}</p>
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {apiData.status}
              </span>
              <span>v{apiData.version}</span>
              <span>•</span>
              <span>{apiData.endpoints?.length || 0} endpoints</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose a Plan</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {apiData.plans?.map((plan: any) => (
          <div
            key={plan.id}
            className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col hover:border-indigo-300 transition"
          >
            <h3 className="font-semibold text-lg text-gray-900">{plan.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ${plan.price}
              </span>
              {plan.price > 0 && <span className="text-gray-500">/mo</span>}
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check size={16} className="text-green-500 flex-shrink-0" />
                {plan.requestLimit === -1 ? 'Unlimited' : plan.requestLimit.toLocaleString()} requests/month
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check size={16} className="text-green-500 flex-shrink-0" />
                {plan.rateLimit} requests/minute
              </li>
              {plan.overagePrice && (
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  ${plan.overagePrice}/extra request
                </li>
              )}
            </ul>
            <button
              onClick={() => subscribe(plan.id)}
              disabled={subscribing === plan.id}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {subscribing === plan.id ? 'Subscribing...' : 'Subscribe'}
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Endpoints */}
      {apiData.endpoints?.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Endpoints</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {apiData.endpoints.map((ep: any) => (
              <div key={ep.id} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded ${
                    ep.method === 'GET'
                      ? 'bg-green-100 text-green-700'
                      : ep.method === 'POST'
                      ? 'bg-blue-100 text-blue-700'
                      : ep.method === 'PUT'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {ep.method}
                </span>
                <code className="text-sm font-mono text-gray-800">{ep.path}</code>
                <span className="text-sm text-gray-500 ml-auto">{ep.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentation */}
      {apiData.documentation && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Documentation</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-8 prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm">{apiData.documentation}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
