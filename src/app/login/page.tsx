'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Already logged in — redirect
  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = login(password);
    if (success) {
      router.push('/');
    } else {
      setError('Wrong password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-extrabold text-white"
            style={{ background: 'linear-gradient(135deg, #ff2d55, #c837ab)', boxShadow: '0 8px 32px rgba(255,45,85,0.3)' }}>R</div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Roblox Creator Hub</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Enter the team password to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="rounded-2xl p-8" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg text-xs font-semibold text-center"
              style={{ background: 'rgba(255,82,82,0.08)', color: '#ff5252', border: '1px solid rgba(255,82,82,0.2)' }}>
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-[11px] font-semibold tracking-wide uppercase mb-2" style={{ color: 'var(--muted)' }}>Team Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              autoFocus
              autoComplete="current-password"
              className="w-full px-4 py-3.5 rounded-xl text-base outline-none transition-all text-center tracking-widest"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', letterSpacing: 4 }}
            />
          </div>

          <button type="submit" disabled={loading || !password}
            className="w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer border-none text-white transition-all"
            style={{
              background: loading || !password ? 'var(--muted)' : 'linear-gradient(135deg, #ff2d55, #c837ab)',
              boxShadow: loading || !password ? 'none' : '0 4px 16px rgba(255,45,85,0.3)',
            }}>
            {loading ? 'Checking...' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
