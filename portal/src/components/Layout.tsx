import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { Zap, Key, CreditCard, BarChart3, Package, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/apis', label: 'API Catalog', icon: Package },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/keys', label: 'API Keys', icon: Key },
  { path: '/dashboard/subscriptions', label: 'Subscriptions', icon: Zap },
  { path: '/dashboard/usage', label: 'Usage', icon: BarChart3 },
  { path: '/dashboard/billing', label: 'Billing', icon: CreditCard },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
                <Zap size={24} />
                API Platform
              </Link>
            </div>

            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white pb-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 text-sm ${
                  location.pathname === item.path ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
