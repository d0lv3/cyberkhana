import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/EnhancedButton';
import Input from '../components/ui/input';
import { Shield, KeyRound, LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';

interface LoginPageProps {
  onLogin: (userData: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoggingIn(true);

    try {
      const API_URL = '/api';

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLogin(data.user);
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="bg-canvas min-h-screen flex items-center justify-center px-4 relative">
      {/* Subtle background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300a859' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted hover:text-brand transition-colors text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="bg-panel/95 border border-edge rounded-2xl shadow-2xl backdrop-blur-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand/20 rounded-full mb-4">
              <BrandLogo variant="mark" alt="" className="h-8 w-8 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-fg mb-2">
              Welcome Back
            </h1>
            <p className="text-muted text-sm">
              Sign in to your account
            </p>
          </div>

          {/* The form stays mounted while the request is in flight. Swapping it
              for a spinner destroyed the fields, dropped keyboard focus to
              <body>, and re-rendered the whole card under the reader on failure.
              The submit button carries the pending state instead. */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div role="alert" className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="login-username" className="block text-sm font-medium text-dim">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-faint" />
                </div>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12"
                  autoComplete="username"
                  disabled={isLoggingIn}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="block text-sm font-medium text-dim">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-faint" />
                </div>
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12"
                  autoComplete="current-password"
                  disabled={isLoggingIn}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  aria-controls="login-password"
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-fg-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon rounded-e-md"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              className="mt-6 h-12"
              isLoading={isLoggingIn}
              leftIcon={<LogIn className="w-5 h-5" />}
            >
              {isLoggingIn ? 'Authenticating…' : 'Sign In'}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-muted text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand hover:text-[#17c66f] font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
