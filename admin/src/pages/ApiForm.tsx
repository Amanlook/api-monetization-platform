import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';

export default function ApiForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', baseUrl: '', basePath: '/',
    version: '1.0.0', status: 'DRAFT', tags: '', documentation: '',
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/apis/${id}`).then(({ data }) => {
        const a = data.api;
        setForm({
          name: a.name, slug: a.slug, description: a.description,
          baseUrl: a.baseUrl, basePath: a.basePath, version: a.version,
          status: a.status, tags: a.tags?.join(', ') || '', documentation: a.documentation || '',
        });
      });
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    try {
      if (isEdit) {
        await api.put(`/admin/apis/${id}`, payload);
      } else {
        await api.post('/admin/apis', payload);
      }
      navigate('/apis');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed');
    }
    setLoading(false);
  }

  const field = (label: string, key: string, type = 'text', opts?: any) => (
    <div className={opts?.full ? 'col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {opts?.textarea ? (
        <textarea
          value={(form as any)[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          rows={6}
        />
      ) : opts?.select ? (
        <select
          value={(form as any)[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          {opts.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={(form as any)[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          required={!opts?.optional}
        />
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit' : 'Create'} API Product</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 max-w-3xl">
        <div className="grid grid-cols-2 gap-4">
          {field('Name', 'name')}
          {field('Slug', 'slug')}
          {field('Base URL (upstream)', 'baseUrl', 'url')}
          {field('Base Path (gateway)', 'basePath')}
          {field('Version', 'version')}
          {field('Status', 'status', 'text', { select: true, options: ['DRAFT', 'ACTIVE', 'DEPRECATED', 'RETIRED'] })}
          {field('Tags (comma separated)', 'tags', 'text', { optional: true, full: true })}
          {field('Description', 'description', 'text', { textarea: true, full: true })}
          {field('Documentation (Markdown)', 'documentation', 'text', { textarea: true, full: true, optional: true })}
        </div>
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={() => navigate('/apis')} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
