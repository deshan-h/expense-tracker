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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] opacity-60 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-600/20 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute top-[30%] left-[40%] w-[30vw] h-[30vw] bg-purple-600/20 rounded-full blur-[120px] opacity-40"></div>
      
      <div className="z-10 w-full max-w-md bg-gray-900/40 backdrop-blur-2xl p-10 rounded-[2rem] border border-gray-700/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] relative group transition-all duration-700 hover:border-gray-600/60">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="flex justify-center mb-10 relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150"></div>
          <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="Expense Tracker Logo" className="w-28 h-28 rounded-3xl shadow-2xl shadow-blue-500/30 object-cover relative z-10 border border-gray-700/50 bg-gray-900" />
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
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
                className="block w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700/80 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
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
                className="block w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700/80 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] text-lg font-black tracking-wide text-white transition-all duration-300 mt-8 ${
              isLoading 
                ? 'bg-blue-600/50 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.6)] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'SECURE SIGN IN'
            )}
          </button>
        </form>
      </div>

      {/* Footer exactly like App.jsx */}
      <footer className="absolute bottom-0 w-full flex items-center justify-center gap-3 py-8 border-t border-gray-800/30 text-gray-400 text-sm font-medium bg-gray-950/40 backdrop-blur-md z-20">
        <span className="tracking-wide">Developed By</span>
        <div className="flex items-center gap-2 bg-gray-900/60 px-3 py-1.5 rounded-full border border-gray-800 shadow-inner">
          <img src={`${import.meta.env.BASE_URL}desh-logo.png`} alt="DEH Logo" className="h-6 w-auto object-contain drop-shadow-md" />
          <span className="text-gray-200 font-black tracking-widest uppercase">Desh</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
