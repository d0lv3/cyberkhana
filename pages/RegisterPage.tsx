import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/EnhancedButton';
import Input from '../components/ui/input';
import { ArrowLeft, Shield, KeyRound, LogIn, School, Eye, EyeOff, UserPlus, Lock } from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';

interface RegisterPageProps {
  onRegister: (userData: any) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [universityCode, setUniversityCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (fullName.length > 50) {
      setError('Full name must be 50 characters or less');
      return;
    }
    if (!password) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!universityCode.trim()) {
      setError('University code is required');
      return;
    }
    if (!acceptedTerms) {
      setError('You must accept the Terms of Service to register');
      return;
    }

    setIsRegistering(true);

    try {
      const API_URL = '/api';

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          fullName,
          password,
          universityCode: universityCode.toUpperCase(),
          acceptedTerms
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onRegister(data.user);
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="bg-canvas app-min-shell flex items-center justify-center px-4 py-6 relative">
      {/* Subtle background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300a859' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Wider than the login card so the paired fields below fit side by
          side, which keeps the whole form on one screen without scrolling. */}
      <div className="w-full max-w-md sm:max-w-xl relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted hover:text-brand transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="bg-panel/95 border border-edge rounded-2xl shadow-2xl backdrop-blur-xl p-4 sm:p-8">
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-brand/20 rounded-full mb-2">
              <BrandLogo variant="mark" alt="" className="h-7 w-7 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-fg mb-1">
              Create Account
            </h1>
            <p className="text-muted text-sm">
              Register to start your CTF journey
            </p>
          </div>

          {/* Kept mounted while submitting — see the note in LoginPage. */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="register-username" className="block text-sm font-medium text-dim">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-faint" />
                  </div>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12"
                    autoComplete="username"
                    disabled={isRegistering}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-fullname" className="block text-sm font-medium text-dim">
                  Full Name
                  <span className="text-faint text-xs ml-2">({fullName.length}/50)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserPlus className="h-5 w-5 text-faint" />
                  </div>
                  <Input
                    id="register-fullname"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12"
                    autoComplete="name"
                    maxLength={50}
                    disabled={isRegistering}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="register-university" className="block text-sm font-medium text-dim">
                University code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <School className="h-5 w-5 text-faint" />
                </div>
                <Input
                  id="register-university"
                  type="text"
                  placeholder="e.g., MIT123"
                  value={universityCode}
                  onChange={(e) => setUniversityCode(e.target.value.toUpperCase())}
                  className="pl-10 h-12"
                  autoComplete="off"
                  autoCapitalize="characters"
                  disabled={isRegistering}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="register-password" className="block text-sm font-medium text-dim">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-faint" />
                  </div>
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-12 h-12"
                    autoComplete="new-password"
                    disabled={isRegistering}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    aria-controls="register-password"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-faint hover:text-fg-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon rounded-e-md"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-confirm" className="block text-sm font-medium text-dim">
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-faint" />
                  </div>
                  <Input
                    id="register-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-12 h-12"
                    autoComplete="new-password"
                    disabled={isRegistering}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showConfirmPassword}
                    aria-controls="register-confirm"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-faint hover:text-fg-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon rounded-e-md"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* The acceptance record starts here. The server re-checks this
                on /auth/register, so posting past the form does not create an
                account without it. */}
            <div className="pt-1">
              <label
                htmlFor="register-terms"
                className="flex items-start gap-3 cursor-pointer text-sm leading-relaxed text-fg-soft"
              >
                <input
                  id="register-terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  disabled={isRegistering}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-edge-light bg-canvas accent-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon"
                  required
                />
                <span>
                  I have read and agree to the{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:text-brand-neon underline underline-offset-4"
                  >
                    Terms of Service
                  </Link>
                  . I am at least 13 years old, and if I am under 18 I have my parent or
                  guardian’s permission.
                </span>
              </label>
              <p className="mt-2 ml-8 text-xs leading-relaxed text-faint">
                You may only use what you learn here against the targets CyberKhana names for
                you. Anywhere else is a crime.
              </p>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              className="mt-2 h-12"
              isLoading={isRegistering}
              leftIcon={<LogIn className="w-5 h-5" />}
            >
              {isRegistering ? 'Creating your account…' : 'Create Account'}
            </Button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <p className="text-muted text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-brand hover:text-[#17c66f] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
