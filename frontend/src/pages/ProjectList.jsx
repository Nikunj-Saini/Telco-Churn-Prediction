import React, { useState } from 'react';
import { Users, TrendingUp, AlertTriangle, CheckCircle2, Zap, Search, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SAMPLE_CUSTOMERS = [
  { id: 1, name: 'Customer #4001', tenure: 2, contract: 'Month-to-month', internet: 'Fiber optic', payment: 'Electronic check', monthly: 89.5, prob: 0.87, tier: 'High' },
  { id: 2, name: 'Customer #2312', tenure: 7, contract: 'Month-to-month', internet: 'Fiber optic', payment: 'Electronic check', monthly: 75.2, prob: 0.79, tier: 'High' },
  { id: 3, name: 'Customer #6504', tenure: 14, contract: 'Month-to-month', internet: 'DSL', payment: 'Mailed check', monthly: 55.0, prob: 0.62, tier: 'Medium' },
  { id: 4, name: 'Customer #1820', tenure: 23, contract: 'One year', internet: 'DSL', payment: 'Bank transfer (automatic)', monthly: 50.0, prob: 0.41, tier: 'Medium' },
  { id: 5, name: 'Customer #3301', tenure: 38, contract: 'One year', internet: 'DSL', payment: 'Credit card (automatic)', monthly: 44.0, prob: 0.28, tier: 'Low' },
  { id: 6, name: 'Customer #7701', tenure: 60, contract: 'Two year', internet: 'No', payment: 'Bank transfer (automatic)', monthly: 20.5, prob: 0.05, tier: 'Low' },
  { id: 7, name: 'Customer #5530', tenure: 5, contract: 'Month-to-month', internet: 'Fiber optic', payment: 'Electronic check', monthly: 99.0, prob: 0.91, tier: 'High' },
  { id: 8, name: 'Customer #9901', tenure: 18, contract: 'Month-to-month', internet: 'Fiber optic', payment: 'Mailed check', monthly: 72.5, prob: 0.66, tier: 'Medium' },
  { id: 9, name: 'Customer #8823', tenure: 45, contract: 'Two year', internet: 'DSL', payment: 'Credit card (automatic)', monthly: 38.0, prob: 0.09, tier: 'Low' },
  { id: 10, name: 'Customer #1145', tenure: 3, contract: 'Month-to-month', internet: 'Fiber optic', payment: 'Electronic check', monthly: 95.0, prob: 0.83, tier: 'High' },
];

const tierColor = (tier, isDark) => ({
  High: isDark ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200',
  Medium: isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
  Low: isDark ? 'bg-teal-500/15 text-[#2dd4bf] border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200',
})[tier];

const ProbBar = ({ prob, isDark }) => {
  const color = prob >= 0.7 ? '#f87171' : prob >= 0.4 ? '#fbbf24' : '#2dd4bf';
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 h-1.5 rounded-full ${isDark ? 'bg-[#1e2430]' : 'bg-slate-200'}`}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.round(prob * 100)}%`, background: color }} />
      </div>
      <span className="text-xs font-black w-10" style={{ color }}>{Math.round(prob * 100)}%</span>
    </div>
  );
};

const ProjectList = ({ onAddClick, onEditClick }) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const filtered = SAMPLE_CUSTOMERS
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter(c => tierFilter === 'ALL' || c.tier === tierFilter);

  const highCount = SAMPLE_CUSTOMERS.filter(c => c.tier === 'High').length;
  const medCount = SAMPLE_CUSTOMERS.filter(c => c.tier === 'Medium').length;
  const lowCount = SAMPLE_CUSTOMERS.filter(c => c.tier === 'Low').length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Customer <span className="animate-color-flow">Risk Segmentation</span>
          </h1>
          <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Scored customers segmented by predicted churn probability
          </p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-[#2dd4bf] hover:bg-[#26bba8] text-[#06080b] px-5 py-2.5 rounded-2xl font-black text-sm shadow-md shadow-[#2dd4bf]/30 transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <Zap className="w-4 h-4" />
          Predict New Customer
        </button>
      </div>

      {/* Tier Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: AlertTriangle, label: 'High Risk', count: highCount, sub: 'Prob > 70%', color: 'bg-rose-500/20 text-rose-400', tier: 'High' },
          { icon: TrendingUp, label: 'Medium Risk', count: medCount, sub: 'Prob 40–70%', color: 'bg-amber-500/20 text-amber-400', tier: 'Medium' },
          { icon: CheckCircle2, label: 'Low Risk', count: lowCount, sub: 'Prob < 40%', color: 'bg-[#2dd4bf]/20 text-[#2dd4bf]', tier: 'Low' },
        ].map(({ icon: Icon, label, count, sub, color, tier }) => (
          <button key={tier} onClick={() => setTierFilter(t => t === tier ? 'ALL' : tier)}
            className={`rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] ${isDark ? 'bg-[#0d1017] border-[#1e2430]' : 'bg-white border-slate-200 shadow-sm'} ${tierFilter === tier ? 'ring-2 ring-[#2dd4bf]' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon className="w-4 h-4" /></div>
            <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</div>
            <div className={`text-xs font-black mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</div>
            <div className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#0d1017] border-[#1e2430]' : 'bg-white border-slate-200 shadow-sm'}`}>
        {/* Toolbar */}
        <div className={`flex items-center gap-3 p-4 border-b ${isDark ? 'border-[#1e2430]' : 'border-slate-100'}`}>
          <div className={`flex items-center gap-2 flex-1 rounded-xl border px-3 py-2 ${isDark ? 'bg-[#080a0f] border-[#1e2430]' : 'bg-slate-50 border-slate-200'}`}>
            <Search className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search customers..."
              className={`flex-1 bg-transparent text-sm font-semibold outline-none ${isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-700 placeholder:text-slate-400'}`}
            />
          </div>
          <div className={`text-xs font-bold px-3 py-2 rounded-xl border ${isDark ? 'bg-[#080a0f] border-[#1e2430] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            {filtered.length} records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs font-black uppercase tracking-wider border-b ${isDark ? 'text-slate-500 border-[#1e2430]' : 'text-slate-400 border-slate-100'}`}>
                <th className="text-left py-3 px-5">Customer</th>
                <th className="text-left py-3 px-4">Tenure</th>
                <th className="text-left py-3 px-4">Contract</th>
                <th className="text-left py-3 px-4">Internet</th>
                <th className="text-left py-3 px-4">Monthly</th>
                <th className="text-left py-3 px-4 min-w-[160px]">Churn Probability</th>
                <th className="text-left py-3 px-4">Risk Tier</th>
                <th className="text-left py-3 px-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`border-b transition-colors ${isDark ? 'border-[#1a1f2a] hover:bg-[#0a0d12]' : 'border-slate-50 hover:bg-slate-50'}`}>
                  <td className={`py-3.5 px-5 font-black ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{c.name}</td>
                  <td className={`py-3.5 px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.tenure} mo</td>
                  <td className={`py-3.5 px-4 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.contract}</td>
                  <td className={`py-3.5 px-4 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.internet}</td>
                  <td className={`py-3.5 px-4 font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>₹{c.monthly}</td>
                  <td className="py-3.5 px-4"><ProbBar prob={c.prob} isDark={isDark} /></td>
                  <td className="py-3.5 px-4">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${tierColor(c.tier, isDark)}`}>{c.tier}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <button onClick={() => onEditClick && onEditClick(c.id)}
                      className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all hover:scale-105 ${isDark ? 'bg-[#0f241e] text-[#2dd4bf] border-[#2dd4bf]/30 hover:bg-[#143229]' : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'}`}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retention Strategy Callout */}
      <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isDark ? 'bg-[#0f241e] border-[#2dd4bf]/20' : 'bg-teal-50 border-teal-200'}`}>
        <div className="flex-1">
          <div className={`font-black text-base ${isDark ? 'text-[#2dd4bf]' : 'text-teal-700'}`}>🎯 Retention Campaign Opportunity</div>
          <div className={`text-sm font-medium mt-1 ${isDark ? 'text-teal-200/70' : 'text-teal-600'}`}>
            Target the <strong>{highCount} High Risk</strong> customers with a personalised retention offer.
            Estimated ROI: <strong>239%</strong> — saving ₹5,000/churner vs ₹500/contact.
          </div>
        </div>
        <button onClick={onAddClick} className="bg-[#2dd4bf] hover:bg-[#26bba8] text-[#06080b] px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all hover:scale-[1.02] shrink-0">
          Predict New →
        </button>
      </div>
    </div>
  );
};

export default ProjectList;
