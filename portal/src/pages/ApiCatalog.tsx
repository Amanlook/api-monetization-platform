import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Search, Tag } from 'lucide-react';

interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  tags: string[];
  logoUrl: string | null;
  plans: { id: string; name: string; price: number; requestLimit: number; rateLimit: number }[];
}

export default function ApiCatalog() {
  const [apis, setApis] = useState<ApiProduct[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApis();
  }, [search]);

  async function loadApis() {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const { data } = await api.get('/portal/apis', { params });
      setApis(data.apis);
    } catch (err) {
      console.error('Failed to load APIs:', err);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Catalog</h1>
          <p className="text-gray-600 mt-1">Browse and subscribe to our APIs</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search APIs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading APIs...</div>
      ) : apis.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No APIs found</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apis.map((a) => (
            <Link
              key={a.id}
              to={`/apis/${a.slug}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
                  {a.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">{a.name}</h3>
                  <span className="text-xs text-gray-500">v{a.version}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{a.description}</p>
              {a.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {a.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      <Tag size={10} />
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{a.plans.length} plans available</span>
                  <span className="text-sm font-medium text-indigo-600">
                    {a.plans[0]?.price === 0
                      ? 'Free tier available'
                      : `From $${a.plans[0]?.price}/mo`}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
