import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

import { signup } from "../api/authApi";
const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agree) {
      setError(
        "You must agree to the Terms of Service"
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const names = name.trim().split(" ");

      const first_name = names[0];

      const last_name =
        names.length > 1
          ? names.slice(1).join(" ")
          : "";

      await signup({
        email,
        password,
        first_name,
        last_name,
      });

      navigate("/login");

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-app-bg overflow-hidden select-none">
      {/* Ambient Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-violet/10 dark:bg-brand-violet/5 filter blur-[120px] pointer-events-none animate-float" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-blue/10 dark:bg-brand-blue/5 filter blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2.3s' }} />

      <div className="w-full max-w-[460px] z-10">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-white active-glow shadow-xl shadow-brand-blue/20 mb-3 animate-pulse">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
            TalkEasy AI
          </span>
          <p className="text-xs font-semibold text-app-text-muted uppercase tracking-widest mt-1.5">Lumina Nexus Interface</p>
        </div>

        {/* Register Card */}
        <Card hoverable={false} className="shadow-2xl border border-glass-border bg-glass-bg">
          <div className="mb-5 text-center md:text-left">
            <h2 className="text-2xl font-bold text-app-text">Create an account</h2>
            <p className="text-sm text-app-text-secondary mt-1">Get started with professional AI voice synthesis</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                id="name"
                label="Full Name"
                type="text"
                placeholder="John Doe"
                icon={User}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                id="email"
                label="Email Address"
                type="email"
                placeholder="name@domain.com"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Password Field */}
                <div className="relative">
                  <Input
                    id="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    icon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Confirm Password Field */}
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    icon={Lock}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-1 pb-2">
              <input
                id="agree"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 rounded border-glass-border bg-glass-input-bg text-brand-blue focus:ring-0 cursor-pointer"
              />
              <label htmlFor="agree" className="text-xs text-app-text-secondary leading-normal cursor-pointer text-left">
                I agree to the <a href="#" className="font-semibold text-brand-blue dark:text-brand-cyan hover:underline">Terms of Service</a> and <a href="#" className="font-semibold text-brand-blue dark:text-brand-cyan hover:underline">Privacy Policy</a>
              </label>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full py-3.5"
            >
              Register <UserPlus size={16} className="ml-2" />
            </Button>
          </form>

          {/* Social Logins */}
          <div className="mt-5">
            <div className="relative flex items-center justify-center my-3">
              <div className="absolute w-full border-t border-glass-border" />
              <span className="relative px-3 text-[11px] font-bold uppercase tracking-wider text-app-text-muted bg-surface-solid border border-glass-border rounded-full">
                or sign up with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => {
                window.location.href =
                  `${import.meta.env.VITE_API_BASE}/auth/login/google`;
              }} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-glass-input-bg hover:bg-surface-solid-hover border border-glass-border rounded-xl text-xs font-semibold text-app-text transition-all duration-300 cursor-pointer">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.822-6.3-6.3 0-3.478 2.822-6.3 6.3-6.3 1.506 0 2.887.533 3.978 1.402l2.907-2.907C18.828 2.21 15.753 1.2 12.24 1.2c-5.967 0-10.8 4.833-10.8 10.8s4.833 10.8 10.8 10.8c5.448 0 10.3-3.86 10.3-10.8 0-.585-.05-1.154-.14-1.715H12.24z" />
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-glass-input-bg hover:bg-surface-solid-hover border border-glass-border rounded-xl text-xs font-semibold text-app-text transition-all duration-300 cursor-pointer">
                <svg className="w-4 h-4 fill-current text-app-text" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                GitHub
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-app-text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-blue dark:text-brand-cyan hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
