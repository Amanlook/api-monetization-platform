import { Link } from 'react-router-dom';
import { Zap, Shield, BarChart3, CreditCard, Code, Globe } from 'lucide-react';

const features = [
  { icon: Globe, title: 'API Marketplace', desc: 'Browse and subscribe to powerful APIs in seconds.' },
  { icon: Shield, title: 'Rate Limiting', desc: 'Built-in rate limiting protects your APIs from abuse.' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Monitor usage, latency, and errors in real-time.' },
  { icon: CreditCard, title: 'Automated Billing', desc: 'Usage-based billing with automated invoicing.' },
  { icon: Code, title: 'Developer Portal', desc: 'Beautiful docs, API keys, and SDKs for developers.' },
  { icon: Zap, title: 'High Performance', desc: 'Sub-millisecond gateway latency at any scale.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero */}
      <header className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <Zap size={24} />
          API Platform
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm">
            Log in
          </Link>
          <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
            Get Started Free
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto text-center px-4 pt-20 pb-16">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight">
          Turn Your APIs into{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            Revenue Streams
          </span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          The complete platform to monetize, manage, and scale your APIs. Built-in billing, rate limiting, analytics, and a beautiful developer portal.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link
            to="/apis"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            Explore APIs
          </Link>
          <Link
            to="/register"
            className="bg-white text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition border border-gray-200"
          >
            Start Building
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything You Need</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <f.icon className="text-indigo-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">{f.title}</h3>
              <p className="mt-2 text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Usage-Based Pricing</h2>
        <p className="text-gray-600 mb-8">Start free. Scale as you grow. No hidden fees.</p>
        <Link
          to="/apis"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          View API Pricing
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} API Monetization Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
