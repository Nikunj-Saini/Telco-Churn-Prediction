import React, { useState } from 'react';
import ProjectList from './pages/ProjectList';
import ProjectForm from './pages/ProjectForm';
import DashboardView from './pages/DashboardView';
import {
  CheckCircle2, AlertCircle, Activity, LayoutDashboard, Layers, Sun, Moon, Zap
} from 'lucide-react';
import { useTheme } from './context/ThemeContext';

function App() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [view, setView] = useState('list');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddClick = () => { setSelectedProjectId(null); setView('add'); };
  const handleEditClick = (id) => { setSelectedProjectId(id); setView('edit'); };
  const handleBackToList = () => { setSelectedProjectId(null); setView('list'); };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark
        ? 'bg-[#011207] text-[#E2F0CC] selection:bg-[#8BC53D] selection:text-[#011207]'
        : 'bg-[#f0f7e8] text-slate-800 selection:bg-[#8BC53D] selection:text-white'
      }`}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-down">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all ${
            toast.type === 'success'
              ? isDark ? 'bg-[#012F13] text-[#8BC53D] border-[#8BC53D]/40' : 'bg-green-50 text-green-800 border-green-300'
              : toast.type === 'error'
                ? isDark ? 'bg-[#260f14] text-rose-300 border-rose-600/40' : 'bg-rose-50 text-rose-800 border-rose-300'
                : isDark ? 'bg-[#012F13] text-[#E2F0CC] border-[#0a3a1a]' : 'bg-white text-slate-800 border-slate-200'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className={`w-6 h-6 shrink-0 ${isDark ? 'text-[#8BC53D]' : 'text-green-600'}`} />}
            {toast.type === 'error' && <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />}
            <span className="text-base font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b py-1 transition-colors duration-300 ${isDark
          ? 'bg-[#010e05]/95 border-[#0a3a1a] shadow-2xl'
          : 'bg-white/95 border-green-200 shadow-sm'
        }`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Brand */}
            <div className="flex items-center gap-3.5 cursor-pointer" onClick={handleBackToList}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#012F13] via-[#1a5c1a] to-[#8BC53D] flex items-center justify-center shadow-lg shadow-[#8BC53D]/25 text-[#011207]">
                <Activity className="w-6 h-6 font-black" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Churn<span className="animate-color-flow font-black">Guard</span>
                  </span>
                  <span className={`text-xs uppercase font-black tracking-wider px-2.5 py-0.5 rounded-lg border ${isDark
                      ? 'bg-[#012F13] text-[#8BC53D] border-[#8BC53D]/40'
                      : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                    ML Powered
                  </span>
                </div>
                <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-[#E2F0CC]/60' : 'text-slate-500'}`}>
                  Telco Customer Churn Prediction Platform
                </p>
              </div>
            </div>

            {/* Nav */}
            <div className={`hidden md:flex items-center gap-2 p-1.5 rounded-2xl border ${isDark ? 'bg-[#012F13] border-[#0a3a1a]' : 'bg-green-50 border-green-200'}`}>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-200 ${view === 'list'
                    ? isDark
                      ? 'bg-[#011207] text-[#8BC53D] shadow-sm border border-[#8BC53D]/40 scale-[1.02]'
                      : 'bg-white text-green-700 shadow-sm border border-green-200 scale-[1.02]'
                    : isDark
                      ? 'text-[#E2F0CC]/70 hover:text-[#E2F0CC] hover:bg-[#011207]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-green-100'
                  }`}
              >
                <Layers className="w-4 h-4" />
                <span>Risk Dashboard</span>
              </button>

              <button
                onClick={() => setView('analytics')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-200 ${view === 'analytics'
                    ? isDark
                      ? 'bg-[#011207] text-[#8BC53D] shadow-sm border border-[#8BC53D]/40 scale-[1.02]'
                      : 'bg-white text-green-700 shadow-sm border border-green-200 scale-[1.02]'
                    : isDark
                      ? 'text-[#E2F0CC]/70 hover:text-[#E2F0CC] hover:bg-[#011207]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-green-100'
                  }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black border transition-all duration-200 hover:scale-105 active:scale-95 ${isDark
                    ? 'bg-[#012F13] hover:bg-[#013a18] text-amber-300 border-[#0a3a1a]'
                    : 'bg-green-50 hover:bg-green-100 text-slate-800 border-green-200'
                  }`}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
              >
                {isDark ? (
                  <><Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /><span className="hidden sm:inline">Light</span></>
                ) : (
                  <><Moon className="w-4 h-4 text-green-800" /><span className="hidden sm:inline">Dark</span></>
                )}
              </button>

              {/* Predict Button */}
              <button
                onClick={handleAddClick}
                className="flex items-center gap-2 bg-[#8BC53D] hover:bg-[#7aad35] text-[#011207] px-5 py-2.5 rounded-2xl font-black text-sm shadow-md shadow-[#8BC53D]/30 transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                <Zap className="w-5 h-5 font-black" />
                <span>Predict Churn</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'list' && (
          <ProjectList onAddClick={handleAddClick} onEditClick={handleEditClick} showToast={showToast} />
        )}
        {view === 'analytics' && (
          <DashboardView onAddClick={handleAddClick} />
        )}
        {view === 'add' && (
          <ProjectForm onBack={handleBackToList} showToast={showToast} />
        )}
        {view === 'edit' && (
          <ProjectForm projectId={selectedProjectId} onBack={handleBackToList} showToast={showToast} />
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-5 text-center text-sm transition-colors duration-300 ${isDark
          ? 'bg-[#010e05] border-[#0a3a1a] text-[#E2F0CC]/50'
          : 'bg-white border-green-200 text-slate-500'
        }`}>
        <div className="max-w-[1440px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} ChurnGuard &bull; IBM Telco Dataset &bull; LightGBM + SHAP</span>
          <div className="flex items-center gap-5 text-xs font-mono">
            <span>API: <strong className={isDark ? 'text-[#E2F0CC]' : 'text-slate-700'}>FastAPI :8000</strong></span>
            <span>Model: <strong className={isDark ? 'text-[#8BC53D]' : 'text-green-600'}>LightGBM · ROC-AUC 0.825</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
