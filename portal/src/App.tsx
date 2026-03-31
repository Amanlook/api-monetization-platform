import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ApiCatalog from './pages/ApiCatalog';
import ApiDetail from './pages/ApiDetail';
import Dashboard from './pages/Dashboard';
import ApiKeys from './pages/ApiKeys';
import Subscriptions from './pages/Subscriptions';
import Usage from './pages/Usage';
import Billing from './pages/Billing';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/apis" element={<Layout />}>
        <Route index element={<ApiCatalog />} />
        <Route path=":slug" element={<ApiDetail />} />
      </Route>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="keys" element={<ApiKeys />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="usage" element={<Usage />} />
        <Route path="billing" element={<Billing />} />
      </Route>
    </Routes>
  );
}
