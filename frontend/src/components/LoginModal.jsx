import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Lock, Mail, Shield, LogIn, UserPlus, CheckCircle2, AlertCircle, X, Sparkles, KeyRound } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, showToast }) => {
  const { isDark } = useTheme();
  const { user, login, register, loginAsDemo, DEMO_ACCOUNTS } = useAuth();

  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      showToast?.(`Welcome back, ${username}!`, 'success');
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password, fullName);
      showToast?.(`Account created! Logged in as ${username}`, 'success');
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = (account) => {
    loginAsDemo(account);
    showToast?.(`Switched active user to ${account.full_name} (${account.role})`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ${isDark
          ? 'bg-[#0b0e14] border-[#1e2430] text-slate-200'
          : 'bg-white border-slate-200 text-slate-800'
        }`}>

        {/* Header Banner */}
        <div className={`px-6 py-5 border-b flex items-center justify-between ${isDark ? 'bg-[#0e121b] border-[#181c24]' : 'bg-slate-50 border-slate-100'
          }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#2dd4bf] flex items-center justify-center text-[#06080b] shadow-md shadow-[#2dd4bf]/20">
              <User className="w-5 h-5 font-black" />
            </div>
            <div>
              <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                User Authentication & Access Control
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Select demo account or sign in to edit projects
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${isDark
                ? 'bg-[#121620] hover:bg-[#1c2230] text-slate-400 hover:text-white border-[#1e2430]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-6 pt-3 gap-2 ${isDark ? 'border-[#181c24] bg-[#0b0e14]' : 'border-slate-100 bg-white'
          }`}>
          <button
            onClick={() => { setActiveTab('demo'); setError(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all ${activeTab === 'demo'
                ? isDark
                  ? 'bg-[#121620] text-[#2dd4bf] border-t-2 border-[#2dd4bf]'
                  : 'bg-teal-50/80 text-teal-700 border-t-2 border-teal-600'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Quick Demo Accounts</span>
          </button>

          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all ${activeTab === 'login'
                ? isDark
                  ? 'bg-[#121620] text-[#2dd4bf] border-t-2 border-[#2dd4bf]'
                  : 'bg-teal-50/80 text-teal-700 border-t-2 border-teal-600'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all ${activeTab === 'register'
                ? isDark
                  ? 'bg-[#121620] text-[#2dd4bf] border-t-2 border-[#2dd4bf]'
                  : 'bg-teal-50/80 text-teal-700 border-t-2 border-teal-600'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className={`mb-4 p-3.5 rounded-2xl text-xs font-bold border flex items-center gap-2.5 ${isDark ? 'bg-rose-950/40 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: Quick Switch Demo Accounts */}
          {activeTab === 'demo' && (
            <div className="space-y-3.5">
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Switch instantly between pre-configured user profiles to test ownership restrictions:
              </p>

              <div className="space-y-2.5">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isCurrent = user?.id === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleQuickSwitch(acc)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isCurrent
                          ? isDark
                            ? 'bg-[#132220] border-[#2dd4bf]/60 text-white ring-1 ring-[#2dd4bf]'
                            : 'bg-teal-50 border-teal-400 text-slate-900 ring-1 ring-teal-400'
                          : isDark
                            ? 'bg-[#0e121b] border-[#1c2230] hover:bg-[#141a26] text-slate-300'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${acc.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/30'
                          }`}>
                          {acc.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm">{acc.full_name}</span>
                            <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md ${acc.role === 'admin'
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                : 'bg-teal-400/20 text-teal-300 border border-teal-400/30'
                              }`}>
                              {acc.role}
                            </span>
                          </div>
                          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            @{acc.username} &bull; {acc.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#2dd4bf]">
                            <CheckCircle2 className="w-4 h-4" /> Active
                          </span>
                        ) : (
                          <button className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${isDark ? 'bg-[#18202e] hover:bg-[#202a3d] text-slate-200' : 'bg-white hover:bg-slate-200 text-slate-800 shadow-sm border'
                            }`}>
                            Switch
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className={`text-[11px] text-center pt-2 italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                💡 Admin can edit/delete all projects. Normal users (John & Sarah) can only edit their own projects.
              </p>
            </div>
          )}

          {/* TAB 2: Sign In Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username (e.g. john)"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] ${isDark ? 'bg-[#121620] border-[#1e2430] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (e.g. john123)"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] ${isDark ? 'bg-[#121620] border-[#1e2430] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-[#2dd4bf] hover:bg-[#26bba8] text-[#06080b] font-black text-sm shadow-lg shadow-[#2dd4bf]/25 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alice Walker"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] ${isDark ? 'bg-[#121620] border-[#1e2430] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="e.g. alice"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] ${isDark ? 'bg-[#121620] border-[#1e2430] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alice@company.com"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] ${isDark ? 'bg-[#121620] border-[#1e2430] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 4 characters"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] ${isDark ? 'bg-[#121620] border-[#1e2430] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-2xl bg-[#2dd4bf] hover:bg-[#26bba8] text-[#06080b] font-black text-sm shadow-lg shadow-[#2dd4bf]/25 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account & Sign In'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoginModal;
