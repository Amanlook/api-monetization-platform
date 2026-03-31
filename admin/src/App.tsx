import { Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './lib/api';
import AdminDashboard from './pages/Dashboard';
import ApisPage from './pages/Apis';
import ApiForm from './pages/ApiForm';
import PlansPage from './pages/Plans';
import UsersPage from './pages/Users';
import AnalyticsPage from './pages/Analytics';
import InvoicesPage from './pages/Invoices';
import {
  LayoutDashboard, Package, CreditCard, Users, BarChart3, FileText, LogOut, Zap, Menu, X,
} from 'lucide-react';

function useAdmin() {
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('admin_user') || 'null'));
  const [token, setToken] = useState(localStorage.getItem('admin_token'));

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.user.role !== 'ADMIN') throw new Error('Not an admin');
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    setUser(data.user);
    setToken(data.token);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    setToken(null);
  };

  return { user, token, login, logout };
}

function LoginPage({ onLogin }: { onLogin: (e: string, p: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-gray-800">
            <Zap size={28} className="text-indigo-600" />
            Admin Dashboard
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const sidebarItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/apis', label: 'APIs', icon: Package },
  { path: '/plans', label: 'Plans', icon: CreditCard },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/invoices', label: 'Invoices', icon: FileText },
];

function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Zap size={22} className="text-indigo-400" />
            Admin
          </div>
          <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                location.pathname === item.path
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <button onClick={onLogout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full px-3 py-2">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <span className="font-semibold">Admin Dashboard</span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, login, logout } = useAdmin();

  if (!user) return <LoginPage onLogin={login} />;

  return (
    <Routes>
      <Route element={<AdminLayout onLogout={logout} />}>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/apis" element={<ApisPage />} />
        <Route path="/apis/new" element={<ApiForm />} />
        <Route path="/apis/:id/edit" element={<ApiForm />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
      </Route>
    </Routes>
  );
}
