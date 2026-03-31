import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Key, Plus, Trash2, Copy, AlertTriangle } from 'lucide-react';

export default function ApiKeys() {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    const { data } = await api.get('/portal/keys');
    setKeys(data.keys);
    setLoading(false);
  }

  async function createKey() {
    setCreating(true);
    try {
      const { data } = await api.post('/portal/keys', { name: newKeyName || 'Default' });
      setNewRawKey(data.key.rawKey);
      setNewKeyName('');
      loadKeys();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create key');
    }
    setCreating(false);
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    await api.delete(`/portal/keys/${id}`);
    loadKeys();
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
      <p className="text-gray-600 mb-8">Manage your API keys for authentication</p>

      {/* Create key */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Key</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Key name (e.g., Production, Staging)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <button
            onClick={createKey}
            disabled={creating}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={16} />
            Create Key
          </button>
        </div>
      </div>

      {/* New key display */}
      {newRawKey && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800">Save Your API Key</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This is the only time you'll see this key. Copy and store it securely.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 bg-white px-4 py-2 rounded border border-yellow-300 text-sm font-mono break-all">
                  {newRawKey}
                </code>
                <button
                  onClick={() => copyKey(newRawKey)}
                  className="p-2 bg-white rounded border border-yellow-300 hover:bg-yellow-100 transition"
                >
                  <Copy size={16} />
                </button>
              </div>
              <button onClick={() => setNewRawKey(null)} className="mt-3 text-sm text-yellow-700 hover:underline">
                I've saved my key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys list */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : keys.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No API keys yet. Create one above to get started.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Key</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Used</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Key size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900">{k.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-gray-600 font-mono">{k.keyPrefix}••••••••</code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        k.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {k.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {k.isActive && (
                      <button
                        onClick={() => revokeKey(k.id)}
                        className="text-red-500 hover:text-red-700 transition p-1"
                        title="Revoke key"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
