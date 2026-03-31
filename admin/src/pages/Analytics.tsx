import { useEffect, useState } from 'react';
import api from '../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';

export default function AnalyticsPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [selectedApi, setSelectedApi] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/apis').then(({ data }) => {
      setApis(data.apis);
      if (data.apis.length > 0) setSelectedApi(data.apis[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedApi) loadAnalytics();
  }, [selectedApi, days]);

  async function loadAnalytics() {
    setLoading(true);
    const { data } = await api.get(`/admin/analytics/${selectedApi}`, { params: { days } });
    setAnalytics(data);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-3">
          <select value={selectedApi} onChange={(e) => setSelectedApi(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm">
            {apis.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading analytics...</div>
      ) : analytics ? (
        <>
          {/* Summary stats */}
          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold">{analytics.summary.totalRequests.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold">{analytics.summary.successRate}%</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500">Avg Response</p>
              <p className="text-2xl font-bold">{analytics.summary.avgResponseMs}ms</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500">Unique Users</p>
              <p className="text-2xl font-bold">{analytics.summary.uniqueUsers}</p>
            </div>
          </div>

          {/* Daily requests chart */}
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Daily Requests</h2>
            {analytics.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total_requests" fill="#6366f1" radius={[4,4,0,0]} name="Requests" />
                  <Bar dataKey="error_count" fill="#ef4444" radius={[4,4,0,0]} name="Errors" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">No data for this period</div>
            )}
          </div>

          {/* Response times chart */}
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Average Response Time (ms)</h2>
            {analytics.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg_response_ms" stroke="#6366f1" strokeWidth={2} dot={false} name="Avg (ms)" />
                  <Line type="monotone" dataKey="p95_response_ms" stroke="#f59e0b" strokeWidth={2} dot={false} name="P95 (ms)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">No data</div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top endpoints */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Top Endpoints</h2>
              <div className="space-y-3">
                {analytics.topEndpoints.map((ep: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${ep.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ep.method}
                      </span>
                      <code className="text-sm">{ep.path}</code>
                    </div>
                    <span className="text-sm text-gray-600">{ep.request_count.toLocaleString()}</span>
                  </div>
                ))}
                {analytics.topEndpoints.length === 0 && <p className="text-gray-500 text-sm">No data</p>}
              </div>
            </div>

            {/* Top users */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Top Users</h2>
              <div className="space-y-3">
                {analytics.topUsers.map((u: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <span className="text-sm text-gray-600">{u.request_count.toLocaleString()} req</span>
                  </div>
                ))}
                {analytics.topUsers.length === 0 && <p className="text-gray-500 text-sm">No data</p>}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
