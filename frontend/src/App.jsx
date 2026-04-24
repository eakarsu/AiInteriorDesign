import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import {
  Home, Palette, Sofa, Sparkles, Camera, CreditCard, Image,
  LogOut, Menu, X, ChevronRight, Plus, Search, Bell, User,
  ArrowLeft, Heart, Eye, Settings, LayoutGrid, List, Wand2,
  Building2, Lightbulb, Layers, Box, Clock, ShoppingCart,
  Download, Check, Trash2, ExternalLink, SplitSquareHorizontal,
  RotateCcw, ChevronDown, ChevronUp, Mail, KeyRound
} from 'lucide-react';
import ComparisonSlider from './components/ComparisonSlider';
import ComparisonSideBySide from './components/ComparisonSideBySide';
import RoomViewer from './components/RoomViewer';
import api from './api';

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Loading Screen
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Login Page
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = async () => {
    try {
      const res = await api.get('/auth/demo-credentials');
      setEmail(res.data.email);
      setPassword(res.data.password);
    } catch (err) {
      setEmail('demo@aiinterior.com');
      setPassword('demo123456');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Interior Design</h1>
          <p className="text-primary-100">Transform your space with AI-powered design</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Welcome Back</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={fillDemoCredentials}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Fill Demo Credentials
            </button>
            <p className="text-center text-gray-500 text-sm mt-3">
              Click to auto-fill demo account details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Forgot Password Page
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
          <p className="text-primary-100">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="you@example.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reset Password Page
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">Invalid reset link. No token provided.</div>
          <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-primary-100">Enter your new password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="Re-enter your password"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Layout with Sidebar
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/designs', icon: LayoutGrid, label: 'My Designs' },
    { path: '/styles', icon: Palette, label: 'Style Presets' },
    { path: '/furniture', icon: Sofa, label: 'Furniture' },
    { path: '/palettes', icon: Layers, label: 'Color Palettes' },
    { path: '/ai-tools', icon: Sparkles, label: 'AI Tools' },
    { path: '/ar', icon: Camera, label: 'AR Experience' },
    { path: '/shopping', icon: ShoppingCart, label: 'Shopping Lists' },
    { path: '/inspirations', icon: Image, label: 'Inspirations' },
    { path: '/materials', icon: Box, label: 'Materials' },
    { path: '/subscription', icon: CreditCard, label: 'Subscription' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-gray-800">AI Interior</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                location.pathname === item.path
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 mb-3">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                alt={user?.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user?.name}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          ) : null}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className={`flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition w-full ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

// Card Component
const Card = ({ item, type, onClick }) => {
  const getImage = () => {
    return item.thumbnail || item.imageUrl || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden card-hover cursor-pointer"
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={getImage()}
          alt={item.name || item.title}
          className="w-full h-full object-cover"
        />
        {item.aiGenerated && (
          <span className="absolute top-2 right-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI
          </span>
        )}
        {item.status && (
          <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full ${
            item.status === 'published' ? 'bg-green-100 text-green-700' :
            item.status === 'active' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {item.status}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1">{item.name || item.title}</h3>
        {item.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
        )}
        {item.style && (
          <span className="inline-block mt-2 text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
            {item.style}
          </span>
        )}
        {item.price !== undefined && (
          <p className="mt-2 font-semibold text-primary-600">${item.price?.toFixed(2)}</p>
        )}
        {item.likes !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
            <Heart className="w-4 h-4" /> {item.likes}
          </div>
        )}
      </div>
    </div>
  );
};

// Row Component with Edit/Delete
const Row = ({ item, onClick, onEdit, onDelete, showActions = false }) => (
  <div
    className="bg-white p-4 rounded-lg border border-gray-100 flex items-center gap-4 hover:shadow-md transition"
  >
    <div className="flex-1 flex items-center gap-4 cursor-pointer" onClick={onClick}>
      {(item.thumbnail || item.imageUrl) && (
        <img
          src={item.thumbnail || item.imageUrl}
          alt={item.name || item.title}
          className="w-16 h-16 rounded-lg object-cover"
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-800">{item.name || item.title}</h4>
        {item.description && (
          <p className="text-sm text-gray-500 truncate">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {item.style && (
            <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{item.style}</span>
          )}
          {item.category && (
            <span className="text-xs bg-secondary-50 text-secondary-700 px-2 py-0.5 rounded-full">{item.category}</span>
          )}
          {item.price !== undefined && (
            <span className="text-xs font-semibold text-green-600">${item.price?.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
    {item.status && (
      <span className={`text-xs px-2 py-1 rounded-full ${
        item.status === 'published' || item.status === 'completed' ? 'bg-green-100 text-green-700' :
        item.status === 'active' ? 'bg-blue-100 text-blue-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {item.status}
      </span>
    )}
    {showActions && (
      <div className="flex items-center gap-1">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
            title="Edit"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    )}
    <ChevronRight className="w-5 h-5 text-gray-400 cursor-pointer" onClick={onClick} />
  </div>
);

// Dashboard
const Dashboard = () => {
  const [stats, setStats] = useState({ designs: 0, arSessions: 0, aiGenerations: 0 });
  const [recentDesigns, setRecentDesigns] = useState([]);
  const [recentInspirations, setRecentInspirations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/designs?limit=4'),
      api.get('/inspirations?limit=6'),
      api.get('/ar?limit=1'),
      api.get('/ai/history?limit=1')
    ]).then(([designs, inspirations, ar, ai]) => {
      setRecentDesigns(designs.data.designs || []);
      setRecentInspirations(inspirations.data.inspirations || []);
      setStats({
        designs: designs.data.total || 0,
        arSessions: ar.data.total || 0,
        aiGenerations: ai.data.total || 0
      });
    }).catch(console.error);
  }, []);

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back!</h1>
        <p className="text-gray-600">Continue designing your perfect space</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-6 rounded-2xl">
          <LayoutGrid className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{stats.designs}</p>
          <p className="text-primary-100">My Designs</p>
        </div>
        <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white p-6 rounded-2xl">
          <Camera className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{stats.arSessions}</p>
          <p className="text-secondary-100">AR Sessions</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 rounded-2xl">
          <Sparkles className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{stats.aiGenerations}</p>
          <p className="text-amber-100">AI Generations</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button onClick={() => navigate('/designs/new')} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition flex flex-col items-center gap-2">
          <Plus className="w-6 h-6 text-primary-600" />
          <span className="font-medium text-gray-700">New Design</span>
        </button>
        <button onClick={() => navigate('/ai-tools')} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition flex flex-col items-center gap-2">
          <Wand2 className="w-6 h-6 text-secondary-600" />
          <span className="font-medium text-gray-700">AI Generate</span>
        </button>
        <button onClick={() => navigate('/ar')} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition flex flex-col items-center gap-2">
          <Camera className="w-6 h-6 text-amber-600" />
          <span className="font-medium text-gray-700">AR View</span>
        </button>
        <button onClick={() => navigate('/inspirations')} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition flex flex-col items-center gap-2">
          <Lightbulb className="w-6 h-6 text-green-600" />
          <span className="font-medium text-gray-700">Get Inspired</span>
        </button>
      </div>

      {/* Recent Designs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Designs</h2>
          <Link to="/designs" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentDesigns.map(design => (
            <Card key={design.id} item={design} onClick={() => navigate(`/designs/${design.id}`)} />
          ))}
        </div>
      </div>

      {/* Inspirations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Trending Inspirations</h2>
          <Link to="/inspirations" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentInspirations.map(insp => (
            <Card key={insp.id} item={insp} onClick={() => navigate(`/inspirations/${insp.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Generic List Page with CRUD
const ListPage = ({ title, endpoint, type, createPath }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();

  const fetchItems = () => {
    api.get(endpoint)
      .then(res => {
        const data = res.data[type] || res.data.sessions || res.data.generations || res.data || [];
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, [endpoint, type]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      setItems(items.filter(item => item.id !== id));
      if (showModal && selectedItem?.id === id) {
        setShowModal(false);
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete item');
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditForm({ ...item });
    setEditMode(true);
    setShowModal(true);
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setEditMode(false);
    setShowModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`${endpoint}/${selectedItem.id}`, editForm);
      setItems(items.map(item => item.id === selectedItem.id ? { ...item, ...editForm } : item));
      setShowModal(false);
      setEditMode(false);
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update item');
    }
  };

  const canEdit = ['designs', 'palettes', 'furniture'].includes(type);
  const canDelete = ['designs', 'palettes', 'furniture', 'sessions'].includes(type);

  if (loading) return <LoadingScreen />;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          {createPath && (
            <button
              onClick={() => navigate(createPath)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No items found</p>
          {createPath && (
            <button
              onClick={() => navigate(createPath)}
              className="mt-4 text-primary-600 font-medium hover:text-primary-700"
            >
              Create your first item
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <Card
              key={item.id}
              item={item}
              type={type}
              onClick={() => handleView(item)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Row
              key={item.id}
              item={item}
              onClick={() => handleView(item)}
              onEdit={canEdit ? handleEdit : null}
              onDelete={canDelete ? handleDelete : null}
              showActions={canEdit || canDelete}
            />
          ))}
        </div>
      )}

      {/* Detail/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditMode(false); }} title={editMode ? `Edit ${title.slice(0, -1)}` : selectedItem?.name || selectedItem?.title || 'Details'}>
        {selectedItem && (
          <div className="space-y-4">
            {/* Image */}
            {(selectedItem.thumbnail || selectedItem.imageUrl) && !editMode && (
              <img
                src={selectedItem.thumbnail || selectedItem.imageUrl}
                alt={selectedItem.name || selectedItem.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}

            {editMode ? (
              /* Edit Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name || editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {(selectedItem.description !== undefined) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows={3}
                    />
                  </div>
                )}
                {(selectedItem.style !== undefined) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <input
                      type="text"
                      value={editForm.style || ''}
                      onChange={(e) => setEditForm({ ...editForm, style: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
                {(selectedItem.price !== undefined) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={editForm.price || ''}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => { setEditMode(false); setEditForm({}); }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View Details */
              <div className="space-y-4">
                {selectedItem.description && (
                  <p className="text-gray-600">{selectedItem.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {selectedItem.style && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Style</p>
                      <p className="font-medium text-gray-800">{selectedItem.style}</p>
                    </div>
                  )}
                  {selectedItem.category && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="font-medium text-gray-800">{selectedItem.category}</p>
                    </div>
                  )}
                  {selectedItem.price !== undefined && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="font-medium text-primary-600">${selectedItem.price?.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedItem.roomType && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Room Type</p>
                      <p className="font-medium text-gray-800">{selectedItem.roomType}</p>
                    </div>
                  )}
                  {selectedItem.material && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Material</p>
                      <p className="font-medium text-gray-800">{selectedItem.material}</p>
                    </div>
                  )}
                  {selectedItem.status && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-medium text-gray-800 capitalize">{selectedItem.status}</p>
                    </div>
                  )}
                  {selectedItem.popularity !== undefined && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Popularity</p>
                      <p className="font-medium text-gray-800">{selectedItem.popularity}</p>
                    </div>
                  )}
                  {selectedItem.likes !== undefined && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Likes</p>
                      <p className="font-medium text-gray-800 flex items-center gap-1"><Heart className="w-4 h-4 text-red-500" /> {selectedItem.likes}</p>
                    </div>
                  )}
                </div>

                {/* Colors */}
                {selectedItem.colors && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Colors</p>
                    <div className="flex gap-2">
                      {(() => {
                        let colorArr = [];
                        try {
                          colorArr = typeof selectedItem.colors === 'string'
                            ? (selectedItem.colors.startsWith('[') ? JSON.parse(selectedItem.colors) : selectedItem.colors.split(','))
                            : selectedItem.colors;
                        } catch { colorArr = []; }
                        return colorArr.map((c, i) => (
                          <div key={i} className="w-8 h-8 rounded-lg border border-gray-200" style={{ backgroundColor: typeof c === 'string' ? c.trim() : c.hex }} title={typeof c === 'string' ? c.trim() : c.hex} />
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/${type}/${selectedItem.id}`)}
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> View Full Details
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => { setEditForm({ ...selectedItem }); setEditMode(true); }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(selectedItem.id)}
                      className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// Detail Page
const DetailPage = ({ endpoint, title }) => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`${endpoint}/${id}`)
      .then(res => setItem(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [endpoint, id]);

  if (loading) return <LoadingScreen />;
  if (!item) return <div className="text-center py-12 text-gray-500">Item not found</div>;

  return (
    <div className="animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {(item.thumbnail || item.imageUrl) && (
          <div className="aspect-video max-h-96 overflow-hidden">
            <img
              src={item.thumbnail || item.imageUrl}
              alt={item.name || item.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{item.name || item.title}</h1>
              {item.style && (
                <span className="inline-block mt-2 text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
                  {item.style}
                </span>
              )}
            </div>
            {item.status && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                item.status === 'published' || item.status === 'completed' ? 'bg-green-100 text-green-700' :
                item.status === 'active' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {item.status}
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-gray-600 mb-6">{item.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {item.roomType && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Room Type</p>
                <p className="font-medium text-gray-800">{item.roomType}</p>
              </div>
            )}
            {item.budget && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-medium text-gray-800">${item.budget.toLocaleString()}</p>
              </div>
            )}
            {item.price !== undefined && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium text-gray-800">${item.price?.toFixed(2)}</p>
              </div>
            )}
            {item.category && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium text-gray-800">{item.category}</p>
              </div>
            )}
            {item.material && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Material</p>
                <p className="font-medium text-gray-800">{item.material}</p>
              </div>
            )}
            {item.likes !== undefined && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Likes</p>
                <p className="font-medium text-gray-800 flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" /> {item.likes}
                </p>
              </div>
            )}
            {item.popularity !== undefined && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Popularity</p>
                <p className="font-medium text-gray-800">{item.popularity}</p>
              </div>
            )}
            {item.createdAt && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-800">{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {item.colors && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Color Palette</h3>
              <div className="flex gap-2 flex-wrap">
                {(() => {
                  let colorArr = [];
                  try {
                    if (typeof item.colors === 'string') {
                      if (item.colors.startsWith('[')) {
                        colorArr = JSON.parse(item.colors);
                      } else {
                        colorArr = item.colors.split(',').map(c => c.trim());
                      }
                    } else {
                      colorArr = item.colors;
                    }
                  } catch {
                    colorArr = item.colors.split(',').map(c => c.trim());
                  }
                  return colorArr.map((color, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-lg shadow-sm border border-gray-200"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ));
                })()}
              </div>
            </div>
          )}

          {item.characteristics && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Characteristics</h3>
              <p className="text-gray-600">{item.characteristics}</p>
            </div>
          )}

          {item.furniture && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Furniture</h3>
              <p className="text-gray-600">{item.furniture}</p>
            </div>
          )}

          {item.materials && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Materials</h3>
              <p className="text-gray-600">{item.materials}</p>
            </div>
          )}

          {item.tags && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.split(',').map((tag, i) => (
                  <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.rooms && item.rooms.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Rooms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.rooms.map(room => (
                  <div key={room.id} className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                    {room.thumbnail && (
                      <img src={room.thumbnail} alt={room.name} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{room.name}</p>
                      <p className="text-sm text-gray-500">{room.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Create Design Page
const CreateDesignPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    style: '',
    roomType: '',
    budget: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const styles = ['Modern Minimalist', 'Scandinavian', 'Industrial', 'Mid-Century Modern', 'Bohemian', 'Contemporary', 'Traditional', 'Coastal', 'Farmhouse', 'Japanese Zen'];
  const roomTypes = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Home Office', 'Dining Room', 'Kids Room', 'Outdoor'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/designs', formData);
      navigate(`/designs/${res.data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Design</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Design Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="My Dream Living Room"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe your design vision..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
              <select
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select style</option>
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
              <select
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select room type</option>
                {roomTypes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="10000"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Design'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Result Display Component
const ResultDisplay = ({ result, activeTab, beforeImage }) => {
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [comparisonMode, setComparisonMode] = useState('none'); // 'none', 'slider', 'side-by-side'

  const data = result.design || result.palette || result.recommendations || result.analysis || result.styleGuide || result;

  const generateImage = async () => {
    setImageLoading(true);
    try {
      const res = await api.post('/ai/generate-image', {
        style: data.style || 'Modern Minimalist',
        roomType: data.roomType || 'Living Room'
      });
      if (res.data.imageUrl) {
        setGeneratedImage(res.data.imageUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImageLoading(false);
    }
  };

  const currentImage = generatedImage || data.imageUrl;

  return (
    <div className="space-y-4">
      {/* Image Section with Comparison Options */}
      {currentImage && (
        <div className="space-y-3">
          {/* Comparison Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setComparisonMode('none')}
                className={`px-3 py-1 text-sm rounded-md transition ${comparisonMode === 'none' ? 'bg-white shadow-sm' : ''}`}
              >
                Single
              </button>
              <button
                onClick={() => setComparisonMode('slider')}
                className={`px-3 py-1 text-sm rounded-md transition ${comparisonMode === 'slider' ? 'bg-white shadow-sm' : ''}`}
              >
                Slider
              </button>
              <button
                onClick={() => setComparisonMode('side-by-side')}
                className={`px-3 py-1 text-sm rounded-md transition ${comparisonMode === 'side-by-side' ? 'bg-white shadow-sm' : ''}`}
              >
                Side by Side
              </button>
            </div>
          </div>

          {/* Image Display */}
          {comparisonMode === 'none' && (
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <img src={currentImage} alt="AI Generated Design" className="w-full h-48 object-cover" />
            </div>
          )}

          {comparisonMode === 'slider' && (
            <ComparisonSlider
              beforeImage={beforeImage}
              afterImage={currentImage}
              beforeLabel="Original"
              afterLabel="AI Generated"
            />
          )}

          {comparisonMode === 'side-by-side' && (
            <ComparisonSideBySide
              beforeImage={beforeImage}
              afterImage={currentImage}
              beforeLabel="Original"
              afterLabel="AI Generated"
            />
          )}
        </div>
      )}

      {!data.imageUrl && !generatedImage && (
        <button
          onClick={generateImage}
          disabled={imageLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {imageLoading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Image...</>
          ) : (
            <><Image className="w-4 h-4" /> Generate Image</>
          )}
        </button>
      )}

      {/* Design Name / Title */}
      {(data.designName || data.paletteName || data.styleName) && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800">{data.designName || data.paletteName || data.styleName}</h3>
          {data.description && <p className="text-sm text-gray-600 mt-1">{data.description}</p>}
          {data.overview && <p className="text-sm text-gray-600 mt-1">{data.overview}</p>}
        </div>
      )}

      {/* Color Palette */}
      {data.colorPalette && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-2">Color Palette</h4>
          <div className="flex gap-2">
            {data.colorPalette.map((color, i) => (
              <div key={i} className="flex-1">
                <div className="h-10 rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: color }} />
                <p className="text-xs text-gray-500 text-center mt-1">{color}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Colors from palette generation */}
      {data.colors && Array.isArray(data.colors) && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-2">Colors</h4>
          <div className="space-y-2">
            {data.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: c.hex || c }} />
                <div>
                  <p className="text-sm font-medium text-gray-700">{c.name || c.hex || c}</p>
                  {c.usage && <p className="text-xs text-gray-500">{c.usage}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Furniture Suggestions */}
      {data.furnitureSuggestions && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-2">Furniture Suggestions</h4>
          <div className="space-y-2">
            {data.furnitureSuggestions.map((item, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                  <span className="text-primary-600 font-semibold text-sm">${item.estimatedPrice?.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                {item.category && <span className="inline-block mt-1 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations (furniture tab) */}
      {data.recommendations && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-2">Recommendations</h4>
          {data.totalEstimatedCost && (
            <p className="text-sm text-primary-600 font-semibold mb-2">Total Estimated: ${data.totalEstimatedCost?.toLocaleString()}</p>
          )}
          <div className="space-y-2">
            {data.recommendations.map((item, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                  {item.estimatedPrice && <span className="text-primary-600 font-semibold text-sm">${item.estimatedPrice?.toLocaleString()}</span>}
                </div>
                {item.reason && <p className="text-xs text-gray-500 mt-1">{item.reason}</p>}
                <div className="flex gap-2 mt-1 flex-wrap">
                  {item.category && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>}
                  {item.material && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{item.material}</span>}
                  {item.style && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{item.style}</span>}
                </div>
              </div>
            ))}
          </div>
          {data.layoutSuggestion && (
            <div className="mt-3 bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800"><strong>Layout:</strong> {data.layoutSuggestion}</p>
            </div>
          )}
        </div>
      )}

      {/* Analysis */}
      {data.analysis && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-2">Room Analysis</h4>
          <div className="bg-gray-50 p-3 rounded-lg mb-2">
            <p className="text-sm text-gray-700">{data.analysis.currentState}</p>
          </div>
          {data.analysis.strengths && (
            <div className="mb-2">
              <p className="text-xs font-medium text-green-700 mb-1">Strengths:</p>
              {data.analysis.strengths.map((s, i) => (
                <p key={i} className="text-xs text-gray-600 ml-2">+ {s}</p>
              ))}
            </div>
          )}
          {data.analysis.weaknesses && (
            <div>
              <p className="text-xs font-medium text-red-700 mb-1">Weaknesses:</p>
              {data.analysis.weaknesses.map((w, i) => (
                <p key={i} className="text-xs text-gray-600 ml-2">- {w}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Improvements */}
      {data.improvements && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-2">Improvements</h4>
          <div className="space-y-2">
            {data.improvements.map((imp, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 text-sm">{imp.area}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    imp.priority === 'high' ? 'bg-red-100 text-red-700' :
                    imp.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>{imp.priority}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{imp.suggestion}</p>
                {imp.estimatedCost && <p className="text-xs text-primary-600 mt-1">{imp.estimatedCost}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layout Tips */}
      {data.layoutTips && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-2">Layout Tips</h4>
          <ul className="space-y-1">
            {data.layoutTips.map((tip, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-2">
                <span className="text-primary-500 font-bold">{i + 1}.</span> {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Material Recommendations */}
      {data.materialRecommendations && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-2">Materials</h4>
          <div className="flex flex-wrap gap-1.5">
            {data.materialRecommendations.map((m, i) => (
              <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">{typeof m === 'string' ? m : m.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Lighting Advice */}
      {data.lightingAdvice && (
        <div className="bg-yellow-50 p-3 rounded-lg">
          <h4 className="font-semibold text-yellow-800 text-sm mb-1">Lighting</h4>
          <p className="text-xs text-yellow-700">{data.lightingAdvice}</p>
        </div>
      )}

      {/* Accent Ideas */}
      {data.accentIdeas && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-2">Accent Ideas</h4>
          <ul className="space-y-1">
            {data.accentIdeas.map((idea, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-2 items-start">
                <Sparkles className="w-3 h-3 text-secondary-500 mt-0.5 flex-shrink-0" /> {idea}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Style Guide specific */}
      {data.keyElements && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-2">Key Elements</h4>
          <div className="flex flex-wrap gap-1.5">
            {data.keyElements.map((el, i) => (
              <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">{el}</span>
            ))}
          </div>
        </div>
      )}

      {data.doAndDont && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-semibold text-green-800 text-xs mb-1">Do</h4>
            {data.doAndDont.do?.map((d, i) => (
              <p key={i} className="text-xs text-green-700">+ {d}</p>
            ))}
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <h4 className="font-semibold text-red-800 text-xs mb-1">Don't</h4>
            {data.doAndDont.dont?.map((d, i) => (
              <p key={i} className="text-xs text-red-700">- {d}</p>
            ))}
          </div>
        </div>
      )}

      {/* Quick Wins */}
      {data.quickWins && (
        <div className="bg-green-50 p-3 rounded-lg">
          <h4 className="font-semibold text-green-800 text-sm mb-1">Quick Wins</h4>
          {data.quickWins.map((w, i) => (
            <p key={i} className="text-xs text-green-700">&#x2713; {w}</p>
          ))}
        </div>
      )}
    </div>
  );
};

// Professional AI Result Display Component
const AIResultDisplay = ({ result, type }) => {
  const data = result.design || result.palette || result.recommendations || result.analysis || result.styleGuide || result.styleMatch || result.budgetPlan || result.transformation || result;

  // Render color swatch
  const ColorSwatch = ({ color, label }) => (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: color }} />
      <div>
        <span className="text-sm font-mono text-gray-700">{color}</span>
        {label && <p className="text-xs text-gray-500">{label}</p>}
      </div>
    </div>
  );

  // Render score bar
  const ScoreBar = ({ label, score, color = 'primary' }) => (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{score}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all bg-${color}-500`}
          style={{ width: `${score}%`, backgroundColor: color === 'primary' ? '#6366f1' : color === 'green' ? '#22c55e' : color === 'amber' ? '#f59e0b' : '#6366f1' }}
        />
      </div>
    </div>
  );

  // Style Match Results
  if (type === 'style-match' && data.primaryMatch) {
    return (
      <div className="space-y-6">
        {/* Primary Match */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-5 rounded-xl border border-primary-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-800">{data.primaryMatch.styleName}</h3>
            <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {data.primaryMatch.matchScore}% Match
            </span>
          </div>
          <p className="text-gray-600 mb-4">{data.primaryMatch.description}</p>

          {data.primaryMatch.recommendedColors && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommended Colors</h4>
              <div className="flex gap-2 flex-wrap">
                {data.primaryMatch.recommendedColors.map((color, i) => (
                  <div key={i} className="w-10 h-10 rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
            </div>
          )}

          {data.primaryMatch.keyCharacteristics && (
            <div className="flex flex-wrap gap-2">
              {data.primaryMatch.keyCharacteristics.map((char, i) => (
                <span key={i} className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm border border-primary-200">{char}</span>
              ))}
            </div>
          )}
        </div>

        {/* Alternative Matches */}
        {data.alternativeMatches && data.alternativeMatches.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Alternative Styles</h4>
            <div className="space-y-2">
              {data.alternativeMatches.map((alt, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{alt.styleName}</p>
                    <p className="text-sm text-gray-500">{alt.whyItFits}</p>
                  </div>
                  <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">{alt.matchScore}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Style Blend Suggestion */}
        {data.styleBlendSuggestion && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2">Style Blend Suggestion</h4>
            <p className="text-amber-900 font-medium">{data.styleBlendSuggestion.combination}</p>
            <p className="text-sm text-amber-700 mt-1">{data.styleBlendSuggestion.description}</p>
            {data.styleBlendSuggestion.ratio && <p className="text-xs text-amber-600 mt-2">Recommended: {data.styleBlendSuggestion.ratio}</p>}
          </div>
        )}

        {/* Personalized Tips */}
        {data.personalizedTips && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Personalized Tips</h4>
            <ul className="space-y-2">
              {data.personalizedTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-primary-500 font-bold">{i + 1}.</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Avoid Styles */}
        {data.avoidStyles && data.avoidStyles.length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-800 mb-2">Styles to Avoid</h4>
            {data.avoidStyles.map((style, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-red-700">{style.styleName}</span>
                <span className="text-red-600"> - {style.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Budget Plan Results
  if (type === 'budget-plan' && data.budgetSummary) {
    return (
      <div className="space-y-6">
        {/* Budget Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Budget Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold text-gray-800">${data.budgetSummary.totalBudget?.toLocaleString()}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-500">Recommended Spend</p>
              <p className="text-2xl font-bold text-green-600">${data.budgetSummary.recommendedSpend?.toLocaleString()}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-500">Contingency Fund</p>
              <p className="text-lg font-semibold text-amber-600">${data.budgetSummary.contingencyFund?.toLocaleString()}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-500">Potential Savings</p>
              <p className="text-lg font-semibold text-primary-600">${data.budgetSummary.potentialSavings?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {data.categoryBreakdown && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Budget Breakdown by Category</h4>
            <div className="space-y-3">
              {data.categoryBreakdown.map((cat, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-800">{cat.category}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        cat.priority === 'high' ? 'bg-red-100 text-red-700' :
                        cat.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>{cat.priority} priority</span>
                    </div>
                    <span className="font-bold text-primary-600">${cat.allocation?.toLocaleString()} ({cat.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${cat.percentage}%` }} />
                  </div>
                  {cat.items && cat.items.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {cat.items.map((item, j) => (
                        <div key={j} className="bg-white p-2 rounded text-sm flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-700">{item.item}</span>
                            {item.savingTip && <p className="text-xs text-green-600 mt-1">Tip: {item.savingTip}</p>}
                          </div>
                          <span className="text-gray-600">{item.budgetRange}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase Timeline */}
        {data.phaseTimeline && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Implementation Timeline</h4>
            <div className="relative">
              {data.phaseTimeline.map((phase, i) => (
                <div key={i} className="flex gap-4 mb-4 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">{phase.phase}</div>
                    {i < data.phaseTimeline.length - 1 && <div className="w-0.5 h-full bg-primary-200 mt-2" />}
                  </div>
                  <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{phase.name}</p>
                        <p className="text-sm text-gray-500">{phase.duration}</p>
                      </div>
                      <span className="font-bold text-primary-600">${phase.budget?.toLocaleString()}</span>
                    </div>
                    {phase.items && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {phase.items.map((item, j) => (
                          <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{item}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Splurge vs Save */}
        {data.splurgeVsSave && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Worth Splurging</h4>
              {data.splurgeVsSave.worthSplurging?.map((item, i) => (
                <p key={i} className="text-sm text-purple-700">+ {item}</p>
              ))}
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Okay to Save</h4>
              {data.splurgeVsSave.okayToSave?.map((item, i) => (
                <p key={i} className="text-sm text-green-700">+ {item}</p>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {data.budgetWarnings && data.budgetWarnings.length > 0 && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2">Budget Warnings</h4>
            {data.budgetWarnings.map((warning, i) => (
              <p key={i} className="text-sm text-amber-700">! {warning}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Transformation Results
  if (type === 'transformation' && data.transformationOverview) {
    return (
      <div className="space-y-6">
        {/* AI Generated Image */}
        {data.afterImageUrl && (
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <img src={data.afterImageUrl} alt="Transformation Result" className="w-full h-48 object-cover" />
          </div>
        )}

        {/* Transformation Overview */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-xl border border-violet-200">
          <h3 className="text-xl font-bold text-gray-800 mb-1">{data.transformationOverview.title}</h3>
          <p className="text-gray-600 italic mb-4">{data.transformationOverview.tagline}</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-violet-600">{data.transformationOverview.transformationScore}%</p>
              <p className="text-sm text-gray-500">Impact Score</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">${data.transformationOverview.estimatedBudget?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Budget</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{data.transformationOverview.timelineWeeks}</p>
              <p className="text-sm text-gray-500">Weeks</p>
            </div>
          </div>
        </div>

        {/* Before vs After */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Before Analysis</h4>
            {data.beforeAnalysis && (
              <>
                <p className="text-sm text-gray-600 mb-2">{data.beforeAnalysis.currentStyle}</p>
                <ScoreBar label="Current Score" score={data.beforeAnalysis.potentialScore} color="gray" />
                {data.beforeAnalysis.painPoints && (
                  <div className="mt-2">
                    {data.beforeAnalysis.painPoints.map((point, i) => (
                      <p key={i} className="text-xs text-red-600">- {point}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">After Vision</h4>
            {data.afterVision && (
              <>
                <p className="text-sm text-green-700 mb-2">{data.afterVision.targetStyle}</p>
                <ScoreBar label="Target Score" score={data.afterVision.targetScore} color="green" />
                <p className="text-xs text-green-600 mt-2 italic">{data.afterVision.moodDescription}</p>
              </>
            )}
          </div>
        </div>

        {/* Transformation Steps */}
        {data.transformationSteps && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Transformation Steps</h4>
            <div className="space-y-3">
              {data.transformationSteps.map((step, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">{step.step}</span>
                      <span className="font-medium text-gray-800">{step.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        step.impact === 'high' ? 'bg-red-100 text-red-700' :
                        step.impact === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>{step.impact} impact</span>
                      <span className="font-bold text-primary-600">${step.cost?.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="bg-gray-100 p-2 rounded"><span className="text-gray-500">Before:</span> {step.beforeState}</div>
                    <div className="bg-green-100 p-2 rounded"><span className="text-green-600">After:</span> {step.afterState}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color Transformation */}
        {data.colorTransformation && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Color Transformation</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Before</p>
                <div className="flex gap-1">
                  {data.colorTransformation.before?.map((color, i) => (
                    <div key={i} className="w-8 h-8 rounded border border-gray-300" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">After</p>
                <div className="flex gap-1">
                  {data.colorTransformation.after?.map((color, i) => (
                    <div key={i} className="w-8 h-8 rounded border border-gray-300" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Impact Metrics */}
        {data.impactMetrics && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">Impact Metrics</h4>
            <div className="space-y-2">
              <ScoreBar label="Aesthetic Improvement" score={data.impactMetrics.aestheticImprovement} color="primary" />
              <ScoreBar label="Functionality Gain" score={data.impactMetrics.functionalityGain} color="blue" />
              <ScoreBar label="Comfort Increase" score={data.impactMetrics.comfortIncrease} color="green" />
              <ScoreBar label="Value Add" score={data.impactMetrics.valueAdd} color="amber" />
            </div>
          </div>
        )}

        {/* Quick Wins */}
        {data.quickWins && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Quick Wins</h4>
            {data.quickWins.map((win, i) => (
              <p key={i} className="text-sm text-green-700">✓ {win}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default: return null for unsupported types (will fall back to ResultDisplay)
  return null;
};

// AI History Panel
const AIHistoryPanel = ({ onLoadHistory, refreshKey }) => {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const limit = 10;

  const typeConfig = {
    design: { label: 'Design', icon: Wand2, color: 'bg-purple-100 text-purple-700', resultKey: 'design' },
    palette: { label: 'Palette', icon: Palette, color: 'bg-pink-100 text-pink-700', resultKey: 'palette' },
    furniture: { label: 'Furniture', icon: Sofa, color: 'bg-amber-100 text-amber-700', resultKey: 'recommendations' },
    analysis: { label: 'Analysis', icon: Eye, color: 'bg-green-100 text-green-700', resultKey: 'analysis' },
    'style-guide': { label: 'Style Guide', icon: Lightbulb, color: 'bg-blue-100 text-blue-700', resultKey: 'styleGuide' },
    'style-match': { label: 'Style Match', icon: Heart, color: 'bg-red-100 text-red-700', resultKey: 'styleMatch' },
    'budget-plan': { label: 'Budget Plan', icon: CreditCard, color: 'bg-teal-100 text-teal-700', resultKey: 'budgetPlan' },
    transformation: { label: 'Transform', icon: SplitSquareHorizontal, color: 'bg-indigo-100 text-indigo-700', resultKey: 'transformation' },
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'design', label: 'Design' },
    { id: 'palette', label: 'Palette' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'style-guide', label: 'Style Guide' },
    { id: 'style-match', label: 'Style Match' },
    { id: 'budget-plan', label: 'Budget Plan' },
    { id: 'transformation', label: 'Transform' },
  ];

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const params = { limit, offset: page * limit };
      if (filter !== 'all') params.type = filter;
      const res = await api.get('/ai/history', { params });
      setHistory(res.data.generations || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, filter, refreshKey]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatTime = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPreview = (item) => {
    try {
      const prompt = JSON.parse(item.prompt);
      const parts = [];
      if (prompt.roomType) parts.push(prompt.roomType);
      if (prompt.style) parts.push(prompt.style);
      if (prompt.mood) parts.push(prompt.mood);
      if (prompt.description) parts.push(prompt.description.slice(0, 60) + (prompt.description.length > 60 ? '...' : ''));
      if (prompt.preferences && !prompt.roomType) parts.push(prompt.preferences.slice(0, 60) + (prompt.preferences.length > 60 ? '...' : ''));
      if (prompt.totalBudget) parts.push(`$${Number(prompt.totalBudget).toLocaleString()}`);
      if (prompt.currentState) parts.push(prompt.currentState.slice(0, 60) + (prompt.currentState.length > 60 ? '...' : ''));
      return parts.join(' · ') || 'AI Generation';
    } catch {
      return 'AI Generation';
    }
  };

  const handleSelect = (item) => {
    setSelectedId(item.id);
    try {
      const parsed = JSON.parse(item.result);
      const cfg = typeConfig[item.type];
      const resultKey = cfg ? cfg.resultKey : item.type;
      const reconstructed = { success: true, [resultKey]: parsed };
      if (item.imageUrl) {
        reconstructed[resultKey] = { ...parsed, imageUrl: item.imageUrl };
      }
      onLoadHistory(reconstructed, item.type);
    } catch (err) {
      console.error('Failed to parse history result:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-800">Generation History</h2>
          {total > 0 && (
            <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); fetchHistory(); }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100">
          <div className="flex gap-1.5 p-3 overflow-x-auto">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition ${
                  filter === f.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loadingHistory && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loadingHistory && history.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No generations yet. Create your first one above!
              </div>
            )}

            {!loadingHistory && history.map(item => {
              const cfg = typeConfig[item.type] || { label: item.type, icon: Sparkles, color: 'bg-gray-100 text-gray-700' };
              const TypeIcon = cfg.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition border-l-3 ${
                    selectedId === item.id
                      ? 'border-l-primary-500 bg-primary-50/50'
                      : 'border-l-transparent'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${cfg.color} mt-0.5`}>
                    <TypeIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{getPreview(item)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// AI Tools Page
const AIToolsPage = () => {
  const [activeTab, setActiveTab] = useState('design');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [formData, setFormData] = useState({
    roomType: 'Living Room',
    style: 'Modern Minimalist',
    budget: '10000',
    preferences: '',
    mood: 'Calm',
    baseColor: '',
    description: '',
    // Style Matcher fields
    lifestyle: '',
    colorPreferences: '',
    spaceType: '',
    budgetRange: '',
    // Budget Planner fields
    totalBudget: '15000',
    priorities: '',
    existingItems: '',
    timeline: '',
    // Transformation fields
    currentState: '',
    desiredStyle: '',
    constraints: '',
    mustKeep: ''
  });

  const tabs = [
    { id: 'design', label: 'Generate Design', icon: Wand2 },
    { id: 'palette', label: 'Color Palette', icon: Palette },
    { id: 'furniture', label: 'Furniture', icon: Sofa },
    { id: 'analysis', label: 'Room Analysis', icon: Eye },
    { id: 'style-guide', label: 'Style Guide', icon: Lightbulb },
    { id: 'style-match', label: 'Style Matcher', icon: Heart },
    { id: 'budget-plan', label: 'Budget Planner', icon: CreditCard },
    { id: 'transformation', label: 'Before/After', icon: SplitSquareHorizontal }
  ];

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      let endpoint = '/ai/generate-design';
      let body = {};

      switch (activeTab) {
        case 'design':
          endpoint = '/ai/generate-design';
          body = { roomType: formData.roomType, style: formData.style, budget: formData.budget, preferences: formData.preferences };
          break;
        case 'palette':
          endpoint = '/ai/generate-palette';
          body = { mood: formData.mood, style: formData.style, roomType: formData.roomType, baseColor: formData.baseColor };
          break;
        case 'furniture':
          endpoint = '/ai/recommend-furniture';
          body = { roomType: formData.roomType, style: formData.style, budget: formData.budget };
          break;
        case 'analysis':
          endpoint = '/ai/analyze-room';
          body = { description: formData.description };
          break;
        case 'style-guide':
          endpoint = '/ai/generate-style-guide';
          body = { style: formData.style, preferences: formData.preferences };
          break;
        case 'style-match':
          endpoint = '/ai/match-style';
          body = {
            preferences: formData.preferences,
            lifestyle: formData.lifestyle,
            colorPreferences: formData.colorPreferences,
            spaceType: formData.spaceType,
            budgetRange: formData.budgetRange
          };
          break;
        case 'budget-plan':
          endpoint = '/ai/plan-budget';
          body = {
            totalBudget: formData.totalBudget,
            roomType: formData.roomType,
            style: formData.style,
            priorities: formData.priorities,
            existingItems: formData.existingItems,
            timeline: formData.timeline
          };
          break;
        case 'transformation':
          endpoint = '/ai/visualize-transformation';
          body = {
            currentState: formData.currentState,
            desiredStyle: formData.desiredStyle || formData.style,
            budget: formData.budget,
            constraints: formData.constraints,
            mustKeep: formData.mustKeep
          };
          break;
      }

      const res = await api.post(endpoint, body);
      setResult(res.data);
      setHistoryRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      setResult({ error: err.response?.data?.message || 'Generation failed. Check your OpenRouter API key.' });
    } finally {
      setLoading(false);
    }
  };

  const sampleDataMap = {
    design: {
      roomType: 'Living Room',
      style: 'Scandinavian',
      budget: '12000',
      preferences: 'Open floor plan with lots of natural light. I love clean lines, wood accents, and cozy textiles. Would like a reading nook by the window.',
    },
    palette: {
      roomType: 'Bedroom',
      style: 'Bohemian',
      mood: 'Cozy',
      baseColor: '#8B6F47',
    },
    furniture: {
      roomType: 'Home Office',
      style: 'Mid-Century Modern',
      budget: '8000',
    },
    analysis: {
      description: 'A 15x20 ft living room with a large south-facing window. Currently has an old brown leather sofa, mismatched coffee table, and outdated carpet. The walls are plain white and the lighting is a single overhead fluorescent. The room feels cold and uninviting despite getting good natural light during the day.',
    },
    'style-guide': {
      style: 'Industrial',
      preferences: 'I love exposed brick, metal accents, and vintage furniture. Want to combine industrial feel with warmth and comfort. Prefer dark color palette with pops of warm amber.',
    },
    'style-match': {
      preferences: 'Clean lines, natural materials, cozy atmosphere with lots of plants and warm lighting',
      lifestyle: 'nature-lover',
      colorPreferences: 'earthy',
      spaceType: 'apartment',
      budgetRange: 'moderate',
    },
    'budget-plan': {
      totalBudget: '20000',
      roomType: 'Living Room',
      style: 'Mid-Century Modern',
      priorities: 'Quality sofa, statement lighting fixture, built-in bookshelves, and a beautiful area rug',
      existingItems: 'TV stand, dining table, two floor lamps',
      timeline: '3-months',
    },
    transformation: {
      currentState: 'Outdated 1990s living room with beige carpet, popcorn ceiling, brass light fixtures, floral wallpaper on one wall, bulky dark wood entertainment center, and a worn plaid sofa. Room is 18x22 ft with two windows on the east wall.',
      desiredStyle: 'Japanese Zen',
      budget: '25000',
      constraints: 'Renting so cannot remove popcorn ceiling or change flooring permanently. Have two large dogs.',
      mustKeep: 'Grandmother\'s vintage rocking chair, the large bookshelf',
    },
  };

  const loadSampleData = () => {
    const sample = sampleDataMap[activeTab];
    if (sample) {
      setFormData(prev => ({ ...prev, ...sample }));
    }
  };

  const loadFromHistory = (reconstructedResult, type) => {
    setActiveTab(type);
    setResult(reconstructedResult);
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">AI Design Tools</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Input Parameters</h2>

          <div className="space-y-4">
            {(activeTab === 'design' || activeTab === 'palette' || activeTab === 'furniture') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Home Office', 'Dining Room'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                  <select
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {['Modern Minimalist', 'Scandinavian', 'Industrial', 'Bohemian', 'Mid-Century Modern', 'Contemporary'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {(activeTab === 'design' || activeTab === 'furniture') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {activeTab === 'palette' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
                  <select
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {['Calm', 'Energetic', 'Cozy', 'Sophisticated', 'Playful', 'Serene'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Color (optional)</label>
                  <input
                    type="color"
                    value={formData.baseColor || '#3B82F6'}
                    onChange={(e) => setFormData({ ...formData, baseColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </>
            )}

            {activeTab === 'analysis' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="Describe your current room setup, dimensions, lighting conditions, and what you'd like to improve..."
                />
              </div>
            )}

            {(activeTab === 'design' || activeTab === 'style-guide') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferences</label>
                <textarea
                  value={formData.preferences}
                  onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Any specific preferences or requirements..."
                />
              </div>
            )}

            {/* Style Matcher Inputs */}
            {activeTab === 'style-match' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Design Preferences</label>
                  <textarea
                    value={formData.preferences}
                    onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="e.g., Clean lines, natural materials, cozy atmosphere..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lifestyle</label>
                  <select
                    value={formData.lifestyle}
                    onChange={(e) => setFormData({ ...formData, lifestyle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select your lifestyle</option>
                    <option value="minimalist">Minimalist - Less is more</option>
                    <option value="busy-professional">Busy Professional - Easy to maintain</option>
                    <option value="family-oriented">Family-Oriented - Kid-friendly & durable</option>
                    <option value="entertainer">Entertainer - Loves hosting guests</option>
                    <option value="homebody">Homebody - Comfort is key</option>
                    <option value="creative">Creative - Artistic & eclectic</option>
                    <option value="nature-lover">Nature Lover - Plants & natural elements</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color Preferences</label>
                  <select
                    value={formData.colorPreferences}
                    onChange={(e) => setFormData({ ...formData, colorPreferences: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select color preference</option>
                    <option value="neutral">Neutral - Whites, grays, beiges</option>
                    <option value="warm">Warm - Reds, oranges, yellows</option>
                    <option value="cool">Cool - Blues, greens, purples</option>
                    <option value="earthy">Earthy - Browns, terracotta, sage</option>
                    <option value="bold">Bold - Bright, saturated colors</option>
                    <option value="monochrome">Monochrome - Black & white</option>
                    <option value="pastel">Pastel - Soft, muted tones</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Space Type</label>
                    <select
                      value={formData.spaceType}
                      onChange={(e) => setFormData({ ...formData, spaceType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select space</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                      <option value="loft">Loft</option>
                      <option value="condo">Condo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                    <select
                      value={formData.budgetRange}
                      onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select budget</option>
                      <option value="budget-friendly">Budget-Friendly ($1K-5K)</option>
                      <option value="moderate">Moderate ($5K-15K)</option>
                      <option value="comfortable">Comfortable ($15K-30K)</option>
                      <option value="premium">Premium ($30K-50K)</option>
                      <option value="luxury">Luxury ($50K+)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Budget Planner Inputs */}
            {activeTab === 'budget-plan' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget ($)</label>
                  <input
                    type="number"
                    value={formData.totalBudget}
                    onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="15000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                    <select
                      value={formData.roomType}
                      onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Home Office', 'Dining Room', 'Entire Home'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desired Style</label>
                    <select
                      value={formData.style}
                      onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {['Modern Minimalist', 'Scandinavian', 'Industrial', 'Bohemian', 'Mid-Century Modern', 'Contemporary', 'Farmhouse', 'Traditional'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorities</label>
                  <textarea
                    value={formData.priorities}
                    onChange={(e) => setFormData({ ...formData, priorities: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="e.g., Quality sofa, good lighting, statement art piece..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Existing Items to Keep</label>
                  <input
                    type="text"
                    value={formData.existingItems}
                    onChange={(e) => setFormData({ ...formData, existingItems: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Dining table, TV stand..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select timeline</option>
                    <option value="1-month">1 Month - Quick makeover</option>
                    <option value="3-months">3 Months - Standard project</option>
                    <option value="6-months">6 Months - Phased approach</option>
                    <option value="1-year">1 Year - Long-term investment</option>
                    <option value="flexible">Flexible - No rush</option>
                  </select>
                </div>
              </>
            )}

            {/* Before/After Transformation Inputs */}
            {activeTab === 'transformation' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Room State</label>
                  <textarea
                    value={formData.currentState}
                    onChange={(e) => setFormData({ ...formData, currentState: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Describe your current room: furniture, colors, issues, what you dislike..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desired Style</label>
                  <select
                    value={formData.desiredStyle || formData.style}
                    onChange={(e) => setFormData({ ...formData, desiredStyle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {['Modern Minimalist', 'Scandinavian', 'Industrial', 'Bohemian', 'Mid-Century Modern', 'Contemporary', 'Farmhouse', 'Coastal', 'Japanese Zen', 'Art Deco'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transformation Budget ($)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Constraints</label>
                  <input
                    type="text"
                    value={formData.constraints}
                    onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Renting (no wall changes), pets, allergies..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items to Keep</label>
                  <input
                    type="text"
                    value={formData.mustKeep}
                    onChange={(e) => setFormData({ ...formData, mustKeep: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Grandmother's armchair, piano, bookshelf..."
                  />
                </div>
              </>
            )}

            <button
              onClick={loadSampleData}
              disabled={loading}
              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4" />
              Load Sample Data
            </button>

            <button
              onClick={generate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate with AI
                </>
              )}
            </button>
          </div>
        </div>

        <AIHistoryPanel onLoadHistory={loadFromHistory} refreshKey={historyRefreshKey} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Result</h2>

          {!result && !loading && (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Configure your parameters and click Generate</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500">AI is generating your design...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {result.error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                  {result.error}
                </div>
              ) : (
                <>
                  {/* Use specialized display for new AI features */}
                  {['style-match', 'budget-plan', 'transformation'].includes(activeTab) ? (
                    <AIResultDisplay result={result} type={activeTab} />
                  ) : (
                    <ResultDisplay result={result} activeTab={activeTab} />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Create Furniture Page
const CreateFurniturePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Seating',
    style: 'Modern',
    color: '',
    material: '',
    price: '',
    dimensions: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const categories = ['Seating', 'Table', 'Storage', 'Decor', 'Lighting', 'Bedroom', 'Outdoor'];
  const styles = ['Modern', 'Scandinavian', 'Industrial', 'Bohemian', 'Mid-Century', 'Farmhouse', 'Traditional', 'Coastal'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/furniture', {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null
      });
      navigate('/furniture');
    } catch (err) {
      console.error(err);
      alert('Failed to create furniture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Furniture</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Modern Sectional Sofa"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
              <select
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Gray"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Linen"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="1500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder='84"W x 36"D x 32"H'
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Add Furniture'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Create Palette Page
const CreatePalettePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    style: 'Modern',
    mood: 'Calm',
    colors: ['#FFFFFF', '#F5F5F5', '#333333', '#666666', '#E0E0E0']
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const styles = ['Modern', 'Scandinavian', 'Industrial', 'Bohemian', 'Mid-Century', 'Farmhouse', 'Traditional', 'Coastal'];
  const moods = ['Calm', 'Energetic', 'Cozy', 'Sophisticated', 'Playful', 'Serene', 'Dramatic', 'Fresh'];

  const updateColor = (index, value) => {
    const newColors = [...formData.colors];
    newColors[index] = value;
    setFormData({ ...formData, colors: newColors });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/palettes', {
        ...formData,
        colors: JSON.stringify(formData.colors)
      });
      navigate('/palettes');
    } catch (err) {
      console.error(err);
      alert('Failed to create palette');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Color Palette</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Palette Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Urban Neutral"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
              <select
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
              <select
                value={formData.mood}
                onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {moods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Colors (5)</label>
            <div className="flex gap-3">
              {formData.colors.map((color, i) => (
                <div key={i} className="flex-1">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateColor(i, e.target.value)}
                    className="w-full h-12 rounded-lg cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => updateColor(i, e.target.value)}
                    className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Preview</p>
            <div className="flex h-16 rounded-lg overflow-hidden">
              {formData.colors.map((color, i) => (
                <div key={i} className="flex-1" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Palette'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Create Shopping List Page
const CreateShoppingListPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/shopping', formData);
      navigate(`/shopping/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create shopping list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Shopping List</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Living Room Essentials"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Shopping list for the new living room makeover..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Shopping List'}
          </button>
        </form>
      </div>
    </div>
  );
};

// AR Page
const ARPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/ar')
      .then(res => setSessions(res.data.sessions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const createSession = async () => {
    setCreating(true);
    try {
      const res = await api.post('/ar', { name: `AR Session ${new Date().toLocaleString()}` });
      navigate(`/ar/${res.data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AR Experience</h1>
          <p className="text-gray-600">Visualize furniture in your space with augmented reality</p>
        </div>
        <button
          onClick={createSession}
          disabled={creating}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition flex items-center gap-2"
        >
          <Camera className="w-4 h-4" /> {creating ? 'Creating...' : 'New AR Session'}
        </button>
      </div>

      <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl p-8 text-white mb-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Bring Your Designs to Life</h2>
          <p className="text-primary-100 mb-6">
            Use your device camera to place furniture and visualize your design in real space.
            Our AR technology helps you make confident decisions before purchasing.
          </p>
          <button
            onClick={createSession}
            className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
          >
            Start AR Experience
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">Previous Sessions</h2>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No AR sessions yet. Start your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(session => (
            <Card
              key={session.id}
              item={session}
              onClick={() => navigate(`/ar/${session.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Subscription Page
const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/subscriptions/plans'),
      api.get('/subscriptions/current')
    ]).then(([plansRes, currentRes]) => {
      setPlans(plansRes.data);
      setCurrent(currentRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const subscribe = async (planId) => {
    try {
      await api.post('/subscriptions/subscribe', { plan: planId });
      const res = await api.get('/subscriptions/current');
      setCurrent(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Subscription Plans</h1>
      <p className="text-gray-600 mb-8">Choose the plan that fits your design needs</p>

      {current && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-600 font-medium">Current Plan</p>
              <p className="text-xl font-bold text-primary-800 capitalize">{current.plan}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-600">Designs Remaining</p>
              <p className="text-xl font-bold text-primary-800">
                {current.designsLeft === -1 ? 'Unlimited' : current.designsLeft}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl border-2 p-6 ${
              index === 1 ? 'border-primary-500 shadow-xl scale-105' : 'border-gray-200'
            }`}
          >
            {index === 1 && (
              <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </span>
            )}
            <h3 className="text-2xl font-bold text-gray-800 mt-4">{plan.name}</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-gray-600 mt-2">
              {plan.designsPerMonth === -1 ? 'Unlimited' : plan.designsPerMonth} designs/month
            </p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600">
                  <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe(plan.id)}
              disabled={current?.plan === plan.id}
              className={`w-full mt-6 py-3 rounded-lg font-semibold transition ${
                current?.plan === plan.id
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : index === 1
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {current?.plan === plan.id ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Shopping List Page
const ShoppingListPage = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/shopping')
      .then(res => setLists(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteList = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this shopping list?')) return;
    try {
      await api.delete(`/shopping/${id}`);
      setLists(lists.filter(l => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const exportPDF = async (id, e) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/export/shopping/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shopping_list_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Shopping Lists</h1>
        <button
          onClick={() => navigate('/shopping/new')}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New List
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No shopping lists yet</p>
          <p className="text-sm mt-2">Create a shopping list from any design</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map(list => (
            <div
              key={list.id}
              onClick={() => navigate(`/shopping/${list.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{list.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => exportPDF(list.id, e)}
                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                    title="Export PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => deleteList(list.id, e)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {list.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{list.description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {list.purchasedCount}/{list.itemCount} items
                </span>
                <span className="font-semibold text-primary-600">
                  ${list.totalPrice?.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${list.itemCount ? (list.purchasedCount / list.itemCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Shopping List Detail Page
const ShoppingListDetailPage = () => {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/shopping/${id}`)
      .then(res => setList(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const togglePurchased = async (itemId, currentStatus) => {
    try {
      await api.patch(`/shopping/items/${itemId}`, { purchased: !currentStatus });
      setList(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, purchased: !currentStatus } : item
        )
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await api.delete(`/shopping/items/${itemId}`);
      setList(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const exportPDF = async () => {
    try {
      const response = await api.get(`/export/shopping/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${list.name.replace(/\s+/g, '_')}_shopping_list.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!list) return <div className="text-center py-12 text-gray-500">Shopping list not found</div>;

  const purchasedCount = list.items?.filter(i => i.purchased).length || 0;
  const totalPrice = list.items?.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0) || 0;

  return (
    <div className="animate-fadeIn">
      <button
        onClick={() => navigate('/shopping')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Shopping Lists
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{list.name}</h1>
            {list.description && (
              <p className="text-gray-600 mt-1">{list.description}</p>
            )}
          </div>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Items</p>
            <p className="text-xl font-bold text-gray-800">{list.items?.length || 0}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Purchased</p>
            <p className="text-xl font-bold text-green-600">{purchasedCount}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold text-primary-600">${totalPrice.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {list.items?.map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${item.purchased ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}
          >
            <button
              onClick={() => togglePurchased(item.id, item.purchased)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.purchased ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}
            >
              {item.purchased && <Check className="w-4 h-4" />}
            </button>

            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
            )}

            <div className="flex-1 min-w-0">
              <h4 className={`font-medium ${item.purchased ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                {item.name}
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {item.storeName && <span>{item.storeName}</span>}
                {item.quantity > 1 && <span>x{item.quantity}</span>}
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-gray-800">${((item.price || 0) * item.quantity).toLocaleString()}</p>
              {item.storeUrl && (
                <a
                  href={item.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 text-sm flex items-center gap-1 hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  Buy <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <button
              onClick={() => deleteItem(item.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Design Detail Page with Export
const DesignDetailPage = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/designs/${id}`)
      .then(res => setItem(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const exportPDF = async () => {
    try {
      const response = await api.get(`/export/design/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${item.name.replace(/\s+/g, '_')}_design.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const createShoppingList = async () => {
    setCreating(true);
    try {
      const res = await api.post(`/shopping/from-design/${id}`);
      navigate(`/shopping/${res.data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!item) return <div className="text-center py-12 text-gray-500">Design not found</div>;

  return (
    <div className="animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {(item.thumbnail || item.imageUrl) && (
          <div className="aspect-video max-h-96 overflow-hidden">
            <img
              src={item.thumbnail || item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{item.name}</h1>
              {item.style && (
                <span className="inline-block mt-2 text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
                  {item.style}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
              {item.furniture && item.furniture.length > 0 && (
                <button
                  onClick={createShoppingList}
                  disabled={creating}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  <ShoppingCart className="w-4 h-4" /> {creating ? 'Creating...' : 'Create Shopping List'}
                </button>
              )}
            </div>
          </div>

          {item.description && (
            <p className="text-gray-600 mb-6">{item.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {item.roomType && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Room Type</p>
                <p className="font-medium text-gray-800">{item.roomType}</p>
              </div>
            )}
            {item.budget && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-medium text-gray-800">${item.budget.toLocaleString()}</p>
              </div>
            )}
            {item.status && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-gray-800 capitalize">{item.status}</p>
              </div>
            )}
            {item.createdAt && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-800">{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {item.furniture && item.furniture.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Furniture ({item.furniture.length} items)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.furniture.map(f => (
                  <div key={f.id} className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                    {f.imageUrl && (
                      <img src={f.imageUrl} alt={f.name} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800">{f.name}</p>
                      <p className="text-sm text-gray-500">{f.category}</p>
                    </div>
                    {f.price && (
                      <p className="font-semibold text-primary-600">${f.price.toLocaleString()}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right">
                <p className="text-lg font-bold text-gray-800">
                  Total: ${item.furniture.reduce((sum, f) => sum + (f.price || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {item.palettes && item.palettes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Color Palettes</h3>
              {item.palettes.map(palette => (
                <div key={palette.id} className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">{palette.name}</p>
                  <div className="flex gap-2">
                    {(() => {
                      let colors = [];
                      try {
                        colors = JSON.parse(palette.colors);
                      } catch {
                        colors = palette.colors.split(',');
                      }
                      return colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-lg shadow-sm border border-gray-200"
                          style={{ backgroundColor: typeof color === 'object' ? color.hex : color }}
                          title={typeof color === 'object' ? color.hex : color}
                        />
                      ));
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {item.rooms && item.rooms.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Rooms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.rooms.map(room => (
                  <div key={room.id} className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                    {room.thumbnail && (
                      <img src={room.thumbnail} alt={room.name} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{room.name}</p>
                      <p className="text-sm text-gray-500">{room.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// AR Detail Page with 3D Viewer
const ARDetailPage = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [furniture, setFurniture] = useState([]);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const navigate = useNavigate();

  const generateRoomImage = async () => {
    setImageLoading(true);
    try {
      const roomType = session?.room?.type || 'Living Room';
      const res = await api.post('/ai/generate-image', {
        roomType: roomType,
        style: 'Modern'
      });
      if (res.data.imageUrl) {
        setGeneratedImage(res.data.imageUrl);
        // Save image to session
        await api.put(`/ar/${id}`, { thumbnail: res.data.imageUrl });
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get(`/ar/${id}`),
      api.get('/ar/furniture/ar-ready')
    ]).then(([sessionRes, furnitureRes]) => {
      setSession(sessionRes.data);
      setFurniture(furnitureRes.data || []);

      // Parse scene data if exists
      if (sessionRes.data.sceneData) {
        try {
          const sceneData = JSON.parse(sessionRes.data.sceneData);
          if (sceneData.furniture) {
            setFurniture(sceneData.furniture);
          }
        } catch (e) {
          console.error('Failed to parse scene data');
        }
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const saveScene = async (furniturePositions) => {
    try {
      await api.put(`/ar/${id}`, {
        sceneData: JSON.stringify({ furniture: furniturePositions })
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!session) return <div className="text-center py-12 text-gray-500">AR Session not found</div>;

  // Get room dimensions from associated room if available
  const roomWidth = session.room?.width || 6;
  const roomLength = session.room?.length || 8;
  const roomHeight = session.room?.height || 3;

  return (
    <div className="animate-fadeIn">
      <button
        onClick={() => navigate('/ar')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to AR Sessions
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{session.name}</h1>
              <span className={`inline-block mt-2 text-sm px-3 py-1 rounded-full ${
                session.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {session.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Created: {new Date(session.createdAt).toLocaleDateString()}
            </p>
          </div>

          {session.room && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Room</p>
              <p className="font-medium text-gray-800">{session.room.name} ({session.room.type})</p>
              {session.room.width && session.room.length && (
                <p className="text-sm text-gray-500">
                  {session.room.width}m x {session.room.length}m
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3D Room Viewer with AI Image */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">3D Room Viewer</h2>
            <p className="text-sm text-gray-500">Generate an AI image to see it on the wall</p>
          </div>
          <button
            onClick={generateRoomImage}
            disabled={imageLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {imageLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Image
              </>
            )}
          </button>
        </div>
        <RoomViewer
          roomWidth={roomWidth}
          roomLength={roomLength}
          roomHeight={roomHeight}
          furniture={furniture}
          onSave={saveScene}
          imageUrl={generatedImage || session.thumbnail}
        />
      </div>
    </div>
  );
};

// Main App
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/designs" element={<ProtectedRoute><Layout><ListPage title="My Designs" endpoint="/designs" type="designs" createPath="/designs/new" /></Layout></ProtectedRoute>} />
          <Route path="/designs/new" element={<ProtectedRoute><Layout><CreateDesignPage /></Layout></ProtectedRoute>} />
          <Route path="/designs/:id" element={<ProtectedRoute><Layout><DesignDetailPage /></Layout></ProtectedRoute>} />
          <Route path="/styles" element={<ProtectedRoute><Layout><ListPage title="Style Presets" endpoint="/styles" type="styles" /></Layout></ProtectedRoute>} />
          <Route path="/styles/:id" element={<ProtectedRoute><Layout><DetailPage endpoint="/styles" title="Style" /></Layout></ProtectedRoute>} />
          <Route path="/furniture" element={<ProtectedRoute><Layout><ListPage title="Furniture Catalog" endpoint="/furniture" type="furniture" createPath="/furniture/new" /></Layout></ProtectedRoute>} />
          <Route path="/furniture/new" element={<ProtectedRoute><Layout><CreateFurniturePage /></Layout></ProtectedRoute>} />
          <Route path="/furniture/:id" element={<ProtectedRoute><Layout><DetailPage endpoint="/furniture" title="Furniture" /></Layout></ProtectedRoute>} />
          <Route path="/palettes" element={<ProtectedRoute><Layout><ListPage title="Color Palettes" endpoint="/palettes" type="palettes" createPath="/palettes/new" /></Layout></ProtectedRoute>} />
          <Route path="/palettes/new" element={<ProtectedRoute><Layout><CreatePalettePage /></Layout></ProtectedRoute>} />
          <Route path="/palettes/:id" element={<ProtectedRoute><Layout><DetailPage endpoint="/palettes" title="Palette" /></Layout></ProtectedRoute>} />
          <Route path="/ai-tools" element={<ProtectedRoute><Layout><AIToolsPage /></Layout></ProtectedRoute>} />
          <Route path="/ar" element={<ProtectedRoute><Layout><ARPage /></Layout></ProtectedRoute>} />
          <Route path="/ar/:id" element={<ProtectedRoute><Layout><ARDetailPage /></Layout></ProtectedRoute>} />
          <Route path="/shopping" element={<ProtectedRoute><Layout><ShoppingListPage /></Layout></ProtectedRoute>} />
          <Route path="/shopping/new" element={<ProtectedRoute><Layout><CreateShoppingListPage /></Layout></ProtectedRoute>} />
          <Route path="/shopping/:id" element={<ProtectedRoute><Layout><ShoppingListDetailPage /></Layout></ProtectedRoute>} />
          <Route path="/inspirations" element={<ProtectedRoute><Layout><ListPage title="Inspirations" endpoint="/inspirations" type="inspirations" /></Layout></ProtectedRoute>} />
          <Route path="/inspirations/:id" element={<ProtectedRoute><Layout><DetailPage endpoint="/inspirations" title="Inspiration" /></Layout></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><Layout><ListPage title="Materials" endpoint="/materials" type="materials" /></Layout></ProtectedRoute>} />
          <Route path="/materials/:id" element={<ProtectedRoute><Layout><DetailPage endpoint="/materials" title="Material" /></Layout></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><Layout><SubscriptionPage /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
