import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Mini bar visualizer
const MiniBar = ({ label, value, max, color, isDark }) => {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`w-40 shrink-0 font-semibold text-xs truncate ${isDark ? 'text-[#E2F0CC]/80' : 'text-slate-600'}`}>{label}</span>
      <div className={`flex-1 rounded-full h-2 ${isDark ? 'bg-[#0a3a1a]' : 'bg-green-100'}`}>
        <div className={`h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={`w-10 text-right text-xs font-black ${isDark ? 'text-[#E2F0CC]' : 'text-slate-700'}`}>{pct}%</span>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color, isDark }) => (
  <div className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all hover:scale-[1.02] ${isDark ? 'bg-[#012F13] border-[#0a3a1a]' : 'bg-white border-green-200 shadow-sm'}`}>
    <div className="flex items-center justify-between">
      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#E2F0CC]/60' : 'text-slate-500'}`}>{label}</span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    {sub && <div className={`text-xs font-medium ${isDark ? 'text-[#E2F0CC]/50' : 'text-slate-500'}`}>{sub}</div>}
  </div>
);

const DonutChart = ({ data, isDark }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cum = 0;
  const R = 50, cx = 60, cy = 60, r = R;
  const paths = data.map((d) => {
    const frac = d.value / total;
    const start = cum; cum += frac;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = cum * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const large = frac > 0.5 ? 1 : 0;
    return { ...d, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });
  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r - 14} fill={isDark ? '#012F13' : '#f0f7e8'} />
        {paths.map((d, i) => <path key={i} d={d.path} fill={d.color} opacity="0.9" />)}
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
            <span className={isDark ? 'text-[#E2F0CC]/80' : 'text-slate-600'}>{d.label}</span>
            <span className={`ml-auto font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {Math.round(d.value / total * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardView = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStats({
      contractBreakdown: [
        { label: 'Month-to-month', value: 42.7, color: '#ef4444' },
        { label: 'One year',       value: 11.3, color: '#f97316' },
        { label: 'Two year',       value: 2.8,  color: '#8BC53D' },
      ],
      internetBreakdown: [
        { label: 'Fiber optic',  value: 41.9, color: '#ef4444' },
        { label: 'DSL',          value: 19.0, color: '#f97316' },
        { label: 'No Internet',  value: 7.4,  color: '#8BC53D' },
      ],
      paymentBreakdown: [
        { label: 'Electronic check',       value: 45.3, color: '#ef4444' },
        { label: 'Mailed check',           value: 19.1, color: '#f97316' },
        { label: 'Bank transfer (auto)',   value: 16.7, color: '#8BC53D' },
        { label: 'Credit card (auto)',     value: 15.2, color: '#E2F0CC' },
      ],
      riskTiers: [
        { label: 'High Risk',   value: 1407, color: '#ef4444' },
        { label: 'Medium Risk', value: 2111, color: '#f97316' },
        { label: 'Low Risk',    value: 3514, color: '#8BC53D' },
      ],
      modelComparison: [
        { name: 'LightGBM',        recall: 0.738, precision: 0.516, f1: 0.607, rocAuc: 0.825 },
        { name: 'Log Regression',  recall: 0.791, precision: 0.488, f1: 0.604, rocAuc: 0.834 },
        { name: 'XGBoost',         recall: 0.652, precision: 0.527, f1: 0.583, rocAuc: 0.810 },
        { name: 'Random Forest',   recall: 0.476, precision: 0.631, f1: 0.543, rocAuc: 0.815 },
      ],
    });
    setLoading(false);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-4 border-[#8BC53D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const card = `rounded-2xl border p-5 ${isDark ? 'bg-[#012F13] border-[#0a3a1a]' : 'bg-white border-green-200 shadow-sm'}`;
  const heading = `text-sm font-black uppercase tracking-wider mb-4 ${isDark ? 'text-[#E2F0CC]/80' : 'text-slate-700'}`;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Churn Analytics <span className="animate-color-flow">Dashboard</span>
        </h1>
        <p className={`text-sm font-medium ${isDark ? 'text-[#E2F0CC]/50' : 'text-slate-500'}`}>
          IBM Telco Dataset · 7,032 customers · Pipeline: LightGBM + SMOTE
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Customers" value="7,032"  sub="IBM Telco dataset"        color="bg-[#8BC53D]/20 text-[#8BC53D]"   isDark={isDark} />
        <StatCard icon={AlertTriangle} label="Churn Rate"      value="26.6%"  sub="1,869 churned customers"  color="bg-rose-500/20 text-rose-400"       isDark={isDark} />
        <StatCard icon={TrendingUp}    label="ROI (Top 20%)"   value="239%"   sub="Targeting risky customers" color="bg-amber-500/20 text-amber-400"     isDark={isDark} />
        <StatCard icon={Activity}      label="Best ROC-AUC"    value="0.834"  sub="Logistic Regression"       color="bg-violet-500/20 text-violet-400"   isDark={isDark} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={card}>
          <h2 className={heading}>Churn by Contract Type</h2>
          <div className="flex flex-col gap-3">
            {stats.contractBreakdown.map((d, i) => <MiniBar key={i} label={d.label} value={d.value} max={50} color={d.color} isDark={isDark} />)}
          </div>
          <p className={`text-xs mt-4 font-medium ${isDark ? 'text-[#E2F0CC]/40' : 'text-slate-400'}`}>
            💡 Month-to-month customers churn <strong>15×</strong> more than 2-year contracts.
          </p>
        </div>

        <div className={card}>
          <h2 className={heading}>Churn by Internet Service</h2>
          <div className="flex flex-col gap-3">
            {stats.internetBreakdown.map((d, i) => <MiniBar key={i} label={d.label} value={d.value} max={50} color={d.color} isDark={isDark} />)}
          </div>
          <p className={`text-xs mt-4 font-medium ${isDark ? 'text-[#E2F0CC]/40' : 'text-slate-400'}`}>
            💡 Fiber optic users churn at <strong>42%</strong> — possible pricing/quality issue.
          </p>
        </div>

        <div className={card}>
          <h2 className={heading}>Customer Risk Tiers</h2>
          <DonutChart data={stats.riskTiers} isDark={isDark} />
          <p className={`text-xs mt-4 font-medium ${isDark ? 'text-[#E2F0CC]/40' : 'text-slate-400'}`}>
            💡 Top <strong>20%</strong> (High Risk) drive most churn & ROI opportunity.
          </p>
        </div>
      </div>

      {/* Payment Method */}
      <div className={card}>
        <h2 className={heading}>Churn by Payment Method</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.paymentBreakdown.map((d, i) => <MiniBar key={i} label={d.label} value={d.value} max={50} color={d.color} isDark={isDark} />)}
        </div>
        <p className={`text-xs mt-4 font-medium ${isDark ? 'text-[#E2F0CC]/40' : 'text-slate-400'}`}>
          💡 Electronic check users churn most. <strong>Promoting autopay</strong> could cut churn by ~30%.
        </p>
      </div>

      {/* Model Comparison */}
      <div className={card}>
        <h2 className={heading}>Model Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-[#E2F0CC]/50' : 'text-slate-400'}`}>
                <th className="text-left pb-3 pr-6">Model</th>
                <th className="text-right pb-3 px-4">Recall</th>
                <th className="text-right pb-3 px-4">Precision</th>
                <th className="text-right pb-3 px-4">F1</th>
                <th className="text-right pb-3 pl-4">ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {stats.modelComparison.map((m, i) => (
                <tr key={i} className={`border-t font-semibold ${isDark ? 'border-[#0a3a1a]' : 'border-green-50'} ${i === 0 ? isDark ? 'text-[#8BC53D]' : 'text-green-600' : isDark ? 'text-[#E2F0CC]/80' : 'text-slate-700'}`}>
                  <td className="py-3 pr-6 font-black">
                    {m.name} {i === 0 && <span className="text-xs ml-1 bg-[#8BC53D]/20 text-[#8BC53D] px-2 py-0.5 rounded-full">Best</span>}
                  </td>
                  <td className="text-right px-4">{(m.recall * 100).toFixed(1)}%</td>
                  <td className="text-right px-4">{(m.precision * 100).toFixed(1)}%</td>
                  <td className="text-right px-4">{(m.f1 * 100).toFixed(1)}%</td>
                  <td className="text-right pl-4">{m.rocAuc.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Insights */}
      <div className={card}>
        <h2 className={heading}>💼 Key Business Insights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '📄', title: 'Contract Type is #1 churn driver',   desc: 'Incentivize customers to upgrade to annual or biannual plans.' },
            { icon: '📡', title: 'Fiber Optic users churn 2× more',    desc: 'Investigate pricing or service quality issues for fiber users.' },
            { icon: '🔒', title: 'TechSupport reduces churn',           desc: 'Bundle TechSupport & Security in entry-level plans.' },
            { icon: '🗓️', title: 'First 12 months are critical',       desc: 'Onboarding programs in the 0-12 month tenure window are most impactful.' },
            { icon: '💳', title: 'Autopay lowers churn by ~30%',        desc: 'Promote automatic payment methods as part of the retention strategy.' },
            { icon: '💰', title: '239% ROI on top 20% risky customers', desc: 'Targeting 1,407 high-risk customers saves ₹5,000/churner vs ₹500/contact.' },
          ].map((ins, i) => (
            <div key={i} className={`rounded-xl p-4 border flex gap-3 ${isDark ? 'bg-[#011207] border-[#0a3a1a]' : 'bg-green-50 border-green-200'}`}>
              <span className="text-xl">{ins.icon}</span>
              <div>
                <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{ins.title}</div>
                <div className={`text-xs font-medium mt-0.5 ${isDark ? 'text-[#E2F0CC]/50' : 'text-slate-500'}`}>{ins.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
