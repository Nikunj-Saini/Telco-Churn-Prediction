import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Activity, ArrowLeft, Zap, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const Select = ({ label, name, value, onChange, options, isDark }) => (
  <div className="flex flex-col gap-1.5">
    <label className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 ${isDark
        ? 'bg-[#080a0f] border-[#1e2430] text-slate-200 hover:border-[#2dd4bf]/40'
        : 'bg-white border-slate-200 text-slate-800 hover:border-teal-300'}`}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const NumberInput = ({ label, name, value, onChange, min, max, step, isDark }) => (
  <div className="flex flex-col gap-1.5">
    <label className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
    <input
      type="number"
      name={name}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step || 1}
      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 ${isDark
        ? 'bg-[#080a0f] border-[#1e2430] text-slate-200 hover:border-[#2dd4bf]/40'
        : 'bg-white border-slate-200 text-slate-800 hover:border-teal-300'}`}
    />
  </div>
);

const defaults = {
  gender: 'Male', SeniorCitizen: 0, Partner: 'No', Dependents: 'No',
  tenure: 12, PhoneService: 'Yes', MultipleLines: 'No',
  InternetService: 'Fiber optic', OnlineSecurity: 'No', OnlineBackup: 'No',
  DeviceProtection: 'No', TechSupport: 'No', StreamingTV: 'No', StreamingMovies: 'No',
  Contract: 'Month-to-month', PaperlessBilling: 'Yes',
  PaymentMethod: 'Electronic check', MonthlyCharges: 70.0, TotalCharges: 840.0,
};

const RiskGauge = ({ probability, isDark }) => {
  const pct = Math.round(probability * 100);
  const angle = -135 + pct * 2.7; // -135 to 135 degrees
  const color = pct >= 70 ? '#f87171' : pct >= 40 ? '#fbbf24' : '#2dd4bf';
  const label = pct >= 70 ? 'HIGH RISK' : pct >= 40 ? 'MEDIUM RISK' : 'LOW RISK';
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div className="relative w-48 h-28 overflow-hidden">
        <svg viewBox="0 0 200 110" width="192" height="110">
          {/* Track */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" stroke={isDark ? '#1e2430' : '#e2e8f0'} strokeWidth="14" fill="none" strokeLinecap="round" />
          {/* Fill */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" stroke={color} strokeWidth="14" fill="none" strokeLinecap="round"
            strokeDasharray={`${pct * 2.51} 251`} style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.5s ease' }} />
          {/* Needle */}
          <line
            x1="100" y1="100"
            x2={100 + 65 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={100 + 65 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke={color} strokeWidth="3" strokeLinecap="round"
            style={{ transition: 'all 0.8s ease' }}
          />
          <circle cx="100" cy="100" r="6" fill={color} />
        </svg>
      </div>
      <div className="text-4xl font-black" style={{ color }}>{pct}%</div>
      <div className={`text-sm font-black tracking-widest px-4 py-1.5 rounded-full border`}
        style={{ color, borderColor: color + '40', background: color + '15' }}>
        {label}
      </div>
    </div>
  );
};

const ProjectForm = ({ onBack, showToast }) => {
  const { isDark } = useTheme();
  const [form, setForm] = useState(defaults);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: ['tenure', 'SeniorCitizen', 'MonthlyCharges', 'TotalCharges'].includes(name) ? parseFloat(value) || 0 : value }));
  };

  const handleReset = () => { setForm(defaults); setResult(null); setError(null); };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch(`${apiBase}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, SeniorCitizen: parseInt(form.SeniorCitizen) }),
      });
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setResult(data.churn_probability);
      showToast('Prediction complete!', 'success');
    } catch (e) {
      setError(e.message);
      showToast('Prediction failed: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const yesNo = ['Yes', 'No'];
  const yesNoNP = ['Yes', 'No', 'No phone service'];
  const yesNoNI = ['Yes', 'No', 'No internet service'];

  const retentionActions = result !== null ? (
    result >= 0.7 ? [
      'Offer a 20% discount on upgrading to a 1-year contract',
      'Assign a dedicated retention specialist to reach out',
      'Bundle TechSupport + OnlineSecurity for free for 3 months',
    ] : result >= 0.4 ? [
      'Send a targeted "we value you" email with loyalty rewards',
      'Offer a 10% loyalty discount on next bill',
      'Nudge towards autopay for convenience discount',
    ] : [
      'No immediate action required — customer is stable',
      'Continue delivering great service',
      'Upsell premium services when appropriate',
    ]
  ) : [];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className={`p-2.5 rounded-xl border transition-all hover:scale-105 ${isDark ? 'bg-[#0d1017] border-[#1e2430] text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'}`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Churn <span className="animate-color-flow">Risk Predictor</span>
          </h1>
          <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Fill in customer details and get an instant ML-powered churn probability score
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <div className={`xl:col-span-2 rounded-2xl border p-6 ${isDark ? 'bg-[#0d1017] border-[#1e2430]' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h2 className={`text-sm font-black uppercase tracking-wider mb-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Customer Details</h2>
          
          {/* Section: Demographics */}
          <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-[#2dd4bf]' : 'text-teal-600'}`}>Demographics</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Select label="Gender" name="gender" value={form.gender} onChange={handleChange} options={['Male', 'Female']} isDark={isDark} />
            <Select label="Senior Citizen" name="SeniorCitizen" value={form.SeniorCitizen} onChange={handleChange} options={[0, 1]} isDark={isDark} />
            <Select label="Partner" name="Partner" value={form.Partner} onChange={handleChange} options={yesNo} isDark={isDark} />
            <Select label="Dependents" name="Dependents" value={form.Dependents} onChange={handleChange} options={yesNo} isDark={isDark} />
          </div>

          {/* Section: Account */}
          <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-[#2dd4bf]' : 'text-teal-600'}`}>Account Info</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <NumberInput label="Tenure (months)" name="tenure" value={form.tenure} onChange={handleChange} min={0} max={120} isDark={isDark} />
            <NumberInput label="Monthly Charges (₹)" name="MonthlyCharges" value={form.MonthlyCharges} onChange={handleChange} min={0} step={0.01} isDark={isDark} />
            <NumberInput label="Total Charges (₹)" name="TotalCharges" value={form.TotalCharges} onChange={handleChange} min={0} step={0.01} isDark={isDark} />
          </div>

          {/* Section: Services */}
          <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-[#2dd4bf]' : 'text-teal-600'}`}>Services</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <Select label="Phone Service" name="PhoneService" value={form.PhoneService} onChange={handleChange} options={yesNo} isDark={isDark} />
            <Select label="Multiple Lines" name="MultipleLines" value={form.MultipleLines} onChange={handleChange} options={yesNoNP} isDark={isDark} />
            <Select label="Internet Service" name="InternetService" value={form.InternetService} onChange={handleChange} options={['DSL', 'Fiber optic', 'No']} isDark={isDark} />
            <Select label="Online Security" name="OnlineSecurity" value={form.OnlineSecurity} onChange={handleChange} options={yesNoNI} isDark={isDark} />
            <Select label="Online Backup" name="OnlineBackup" value={form.OnlineBackup} onChange={handleChange} options={yesNoNI} isDark={isDark} />
            <Select label="Device Protection" name="DeviceProtection" value={form.DeviceProtection} onChange={handleChange} options={yesNoNI} isDark={isDark} />
            <Select label="Tech Support" name="TechSupport" value={form.TechSupport} onChange={handleChange} options={yesNoNI} isDark={isDark} />
            <Select label="Streaming TV" name="StreamingTV" value={form.StreamingTV} onChange={handleChange} options={yesNoNI} isDark={isDark} />
            <Select label="Streaming Movies" name="StreamingMovies" value={form.StreamingMovies} onChange={handleChange} options={yesNoNI} isDark={isDark} />
          </div>

          {/* Section: Billing */}
          <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-[#2dd4bf]' : 'text-teal-600'}`}>Billing</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Select label="Contract" name="Contract" value={form.Contract} onChange={handleChange} options={['Month-to-month', 'One year', 'Two year']} isDark={isDark} />
            <Select label="Paperless Billing" name="PaperlessBilling" value={form.PaperlessBilling} onChange={handleChange} options={yesNo} isDark={isDark} />
            <Select label="Payment Method" name="PaymentMethod" value={form.PaymentMethod} onChange={handleChange}
              options={['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)']} isDark={isDark} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePredict}
              disabled={loading}
              className="flex items-center gap-2 bg-[#2dd4bf] hover:bg-[#26bba8] disabled:opacity-50 text-[#06080b] px-6 py-3 rounded-2xl font-black text-sm shadow-md shadow-[#2dd4bf]/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Predicting...' : 'Predict Churn Risk'}
            </button>
            <button onClick={handleReset} className={`flex items-center gap-2 px-4 py-3 rounded-2xl border font-black text-sm transition-all hover:scale-[1.02] ${isDark ? 'bg-[#0d1017] border-[#1e2430] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {error && (
            <div className={`mt-4 rounded-xl border p-4 flex gap-3 items-start ${isDark ? 'bg-[#260f14] border-rose-600/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-sm">API Error</div>
                <div className="text-xs mt-0.5">{error}</div>
                <div className="text-xs mt-1 opacity-70">Make sure FastAPI backend is running: <code>uvicorn app.api:app --reload --port 8000</code></div>
              </div>
            </div>
          )}
        </div>

        {/* Result Panel */}
        <div className="flex flex-col gap-5">
          <div className={`rounded-2xl border p-6 flex flex-col items-center ${isDark ? 'bg-[#0d1017] border-[#1e2430]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h2 className={`text-sm font-black uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Churn Score</h2>
            {result !== null ? (
              <RiskGauge probability={result} isDark={isDark} />
            ) : (
              <div className="py-10 flex flex-col items-center gap-3">
                <Activity className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm font-medium text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Fill in customer details and click <strong>Predict</strong> to see the churn risk score</p>
              </div>
            )}
          </div>

          {result !== null && (
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#0d1017] border-[#1e2430]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h2 className={`text-sm font-black uppercase tracking-wider mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>🎯 Recommended Actions</h2>
              <div className="flex flex-col gap-2.5">
                {retentionActions.map((a, i) => (
                  <div key={i} className={`flex items-start gap-2.5 text-sm rounded-xl p-3 border ${isDark ? 'bg-[#080a0f] border-[#1e2430]' : 'bg-slate-50 border-slate-200'}`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2dd4bf] mt-0.5" />
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimal Threshold Info */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#0d1017] border-[#1e2430]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h2 className={`text-sm font-black uppercase tracking-wider mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>💡 Cost Analysis</h2>
            <div className="flex flex-col gap-2 text-xs font-medium">
              {[
                { k: 'Optimal Threshold', v: '0.18 (cost-optimized)' },
                { k: 'Missed Churner Cost', v: '₹5,000 per customer' },
                { k: 'Retention Offer Cost', v: '₹500 per contact' },
                { k: 'Campaign ROI', v: '239% (top 20% customers)' },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between items-center">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{k}</span>
                  <span className={`font-black ${isDark ? 'text-[#2dd4bf]' : 'text-teal-600'}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
