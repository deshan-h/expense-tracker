import { useState } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight, UserPlus, LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.session) {
          toast.success('Account created successfully! Welcome!');
        } else {
          toast.success('Sign up successful! Please check your email to confirm, or log in.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid credentials. If this is a new Supabase project, click "Create an Account" below!');
          } else {
            throw error;
          }
          return;
        }
        toast.success('Welcome back!');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] opacity-60 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-600/20 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute top-[30%] left-[40%] w-[30vw] h-[30vw] bg-purple-600/20 rounded-full blur-[120px] opacity-40"></div>
      
      <div className="z-10 w-full max-w-md bg-gray-900/40 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-gray-700/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] relative group transition-all duration-700 hover:border-gray-600/60">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150"></div>
          <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="Expense Tracker Logo" className="w-24 h-24 rounded-3xl shadow-2xl shadow-blue-500/30 object-cover relative z-10 border border-gray-700/50 bg-gray-900" />
        </div>

        <div className="text-center mb-6 relative z-10">
          <h2 className="text-xl font-black text-white tracking-wide">
            {isSignUp ? 'CREATE SUPABASE ACCOUNT' : 'EXPENSE TRACKER LOGIN'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isSignUp ? 'Set your admin email and password' : 'Sign in to access your dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Email Address</label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within/input:text-blue-400">
                <Mail className="h-5 w-5 text-gray-500 group-focus-within/input:text-blue-400 transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-700/80 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner text-sm"
                placeholder="admin@desh.lk"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Password</label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within/input:text-blue-400">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within/input:text-blue-400 transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-700/80 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2 group/btn ${
              isLoading
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-blue-500/25 active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-800 text-center relative z-10">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-gray-400 hover:text-blue-400 transition-colors"
          >
            {isSignUp 
              ? 'Already have an account? Sign In' 
              : "First time on this Supabase project? Create an Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
