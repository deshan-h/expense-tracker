import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import toast from 'react-hot-toast';
import { Lock, Mail, TrendingUp } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
    } catch (error) {
      console.error(error);
      toast.error('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px]"></div>
      
      <div className="z-10 w-full max-w-md bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-700/50 shadow-2xl">
        <div className="flex justify-center mb-8">
          <img src="pwa-192x192.png" alt="Expense Tracker Logo" className="w-20 h-20 rounded-2xl shadow-lg shadow-blue-500/30 object-cover" />
        </div>
        
        <h2 className="text-3xl font-bold text-center text-white mb-2">Expense Tracker</h2>
        <p className="text-center text-gray-400 mb-8">Sign in to manage your finances</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="admin@desh.lk"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white transition-all ${
              isLoading 
                ? 'bg-blue-600/50 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/25 active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Secure Sign In'
            )}
          </button>
        </form>
      </div>

      <div className="mt-10 z-10 flex items-center gap-2 opacity-70 hover:opacity-100 transition-all duration-500 cursor-default group">
        <span className="text-gray-400 text-xs font-semibold tracking-[0.2em] uppercase">Developed By</span>
        <div className="relative">
          <span className="absolute -inset-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></span>
          <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 font-black text-sm tracking-[0.3em] uppercase drop-shadow-sm">
            DESH
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
