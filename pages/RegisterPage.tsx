import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import Button from '../components/ui/EnhancedButton';
import Input from '../components/ui/input';
import CyberMatrixHero from '../components/ui/cyber-matrix-hero';
import { Shield, KeyRound, LogIn, School, Eye, EyeOff, UserPlus, Lock } from 'lucide-react';
import Loader from '../components/ui/Loader';
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
          universityCode: universityCode.toUpperCase()
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
    <div className="bg-[#0d1117] min-h-screen">
      <CyberMatrixHero onCTAClick={() => {
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
          registerForm.scrollIntoView({ behavior: 'smooth' });
        }
      }} />

      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center gap-5">
            <BrandLogo variant="academy" loading="eager" className="h-14 md:h-20 w-auto object-contain" />
            <h1 className="text-4xl font-bold text-zinc-100 md:text-6xl tracking-tight">
              Build Your Security Skills
            </h1>
          </div>
        }
      >
        <img
          src="/assets/dashboard-preview.png"
          alt="CyberKhana Dashboard"
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-top"
          draggable={false}
        />
      </ContainerScroll>

      <div id="register-form" className="flex items-center justify-center -mt-[25rem] md:-mt-[35rem] pb-20 relative z-10 px-4">
        <div className="w-full max-w-md">
          <div className="bg-[#121a2a]/95 border border-[#263248] rounded-2xl shadow-2xl backdrop-blur-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00a859]/20 rounded-full mb-4">
                <BrandLogo variant="mark" alt="" className="h-8 w-8 object-contain" />
              </div>
              <h2 className="text-3xl font-bold text-[#f3f6ff] mb-2">
                Create Account
              </h2>
              <p className="text-[#9aa5bf] text-sm">
                Register to start your CTF journey
              </p>
            </div>

            {isRegistering ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader />
                <p className="text-[#9aa5bf] mt-4">Creating your account...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8390ac] uppercase tracking-wider">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-[#6e7a94]" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8390ac] uppercase tracking-wider">
                    Full Name
                    <span className="text-[#6e7a94] text-xs ml-2">({fullName.length}/50)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserPlus className="h-5 w-5 text-[#6e7a94]" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-12"
                      autoComplete="name"
                      maxLength={50}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8390ac] uppercase tracking-wider">University Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <School className="h-5 w-5 text-[#6e7a94]" />
                    </div>
                    <Input
                      type="text"
                      placeholder="e.g., MIT123"
                      value={universityCode}
                      onChange={(e) => setUniversityCode(e.target.value.toUpperCase())}
                      className="pl-10 h-12"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8390ac] uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-[#6e7a94]" />
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6e7a94] hover:text-[#d2d7e3] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8390ac] uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-[#6e7a94]" />
                    </div>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6e7a94] hover:text-[#d2d7e3] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  className="mt-6 h-12"
                  isLoading={isRegistering}
                  leftIcon={<LogIn className="w-5 h-5" />}
                >
                  Create Account
                </Button>
              </form>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-[#9aa5bf] text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#00a859] hover:text-[#17c66f] font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
