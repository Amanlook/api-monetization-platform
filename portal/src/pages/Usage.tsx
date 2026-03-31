import { useEffect, useState } from 'react';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Usage() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, [days]);

  async function loadUsage() {
    setLoading(true);
    const { data } = await api.get('/portal/usage', { params: { days } });
    setData(data);
    setLoading(false);
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  const chartData = data?.dailyUsage?.reduce((acc: any[], row: any) => {
    const existing = acc.find((d: any) => d.date === row.date);
    if (existing) {
      existing.requests += row.requests;
      existing.errors += row.errors;
    } else {
      acc.push({ date: row.date, requests: row.requests, errors: row.errors, api: row.api_name });
    }
    return acc;
  }, []) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usage Analytics</h1>
          <p className="text-gray-600 mt-1">Monitor your API consumption</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Totals */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Requests</p>
          <p className="text-3xl font-bold text-gray-900">{data?.totals?._count?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Avg Latency</p>
          <p className="text-3xl font-bold text-gray-900">
            {data?.totals?._avg?.responseTimeMs?.toFixed(0) || 0}ms
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Requests</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(d) => new Date(d).toLocaleDateString()}
                formatter={(value: number) => [value.toLocaleString(), '']}
              />
              <Bar dataKey="requests" fill="#6366f1" radius={[4, 4, 0, 0]} name="Requests" />
              <Bar dataKey="errors" fill="#ef4444" radius={[4, 4, 0, 0]} name="Errors" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">No usage data for this period</div>
        )}
      </div>
    </div>
  );
}
