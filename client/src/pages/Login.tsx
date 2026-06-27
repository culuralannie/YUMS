import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({
        email,
        password,
      });
    } else {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      if (isSignUp && result.data.user?.identities?.length === 0) {
        setError('Account already exists, please sign in.');
      } else if (isSignUp) {
        setError('Sign up successful! You can now sign in.');
        setIsSignUp(false);
      } else {
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0f172a]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white text-center">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="text-slate-400 mt-2 text-center">
              {isSignUp ? 'Sign up to manage your uploads' : 'Sign in to manage your uploads'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-6"
            >
              {loading ? (isSignUp ? 'Signing up...' : 'Signing in...') : (isSignUp ? 'Sign up' : 'Sign in')}
            </button>
            
            <p className="text-center text-sm text-slate-400 mt-4">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }} 
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
