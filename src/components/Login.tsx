import React, { useState } from 'react';
import { ShieldAlert, Cpu, Lock, User as UserIcon, Server, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.message || 'Authentication rejected by security gateway.');
      }
    } catch (err: any) {
      setError('Could not establish connection to authentication service.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Visual Tech Background Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      
      {/* Main Container */}
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl p-8 relative z-10">
        
        {/* Brand Identity / Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 border-2 border-amber-500 rounded-lg flex items-center justify-center text-amber-500 mb-3">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans uppercase">
            Spool Number Extractor
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-mono tracking-wide">
            Emarataloula Industries
          </p>
        </div>



        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-semibold">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                id="login-username-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter operator username"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2 pl-10 pr-4 text-sm text-white font-mono placeholder-slate-600 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-semibold">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-password-input"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2 pl-10 pr-10 text-sm text-white font-mono placeholder-slate-600 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember & Options */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                id="login-remember-me-checkbox"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
              />
              <span>Remember session</span>
            </label>
          </div>

          {/* Errors display */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg flex items-start space-x-2 text-xs text-red-300 font-mono">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="inline-block border-2 border-slate-950 border-t-transparent rounded-full w-4 h-4 animate-spin" />
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>


      </div>

      {/* Safety Legal Footer */}
      <footer className="mt-8 text-center text-slate-500 text-[10px] font-mono leading-relaxed max-w-md relative z-10 uppercase tracking-widest space-y-1">
        <div>© 2026 Spool Extractor. Published by Muhammed Rihan. All rights reserved.</div>
        <div className="text-slate-600">Contact Support: <a href="tel:+971566202782" className="text-amber-600/80 hover:text-amber-500 font-bold">+971 56 620 2782</a></div>
      </footer>
    </div>
  );
}
