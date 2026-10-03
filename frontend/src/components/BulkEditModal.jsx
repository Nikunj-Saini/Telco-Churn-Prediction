import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit3, CheckCircle2, AlertCircle, X, ArrowRight, Layers } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const BulkEditModal = ({ isOpen, onClose, selectedProjects = [], lookups = {}, onSuccess, apiBaseUrl = 'http://localhost:5000/api', showToast }) => {
  const { isDark } = useTheme();
  const { getAuthHeaders } = useAuth();


  // Selected fields to update state
  const [activeFields, setActiveFields] = useState({
    division: false,
    category: false,
    status: false,
    fy: false,
    projectType: false,
    aiDx: false,
    inhouse: false,
    investmentMrs: false,
    manhourSavings: false
  });

  // Values state
  const [fieldValues, setFieldValues] = useState({
    division: '',
    category: '',
    status: 'Live',
    fy: 'FY 24-25',
    projectType: '',
    aiDx: 'DX',
    inhouse: 'DIV',
    investmentMrs: '',
    manhourSavings: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleField = (field) => {
    setActiveFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleValueChange = (field, value) => {
    setFieldValues(prev => ({ ...prev, [field]: value }));
  };

  const selectedCount = selectedProjects.length;
  const anyFieldSelected = Object.values(activeFields).some(Boolean);

  const handleSubmit = async () => {
    if (!anyFieldSelected) {
      showToast('Please select at least one field to update.', 'error');
      return;
    }

    // Build payload of only selected fields
    const updateData = {};
    if (activeFields.division) updateData.division = fieldValues.division;
    if (activeFields.category) updateData.category = fieldValues.category;
    if (activeFields.status) updateData.status = fieldValues.status;
    if (activeFields.fy) updateData.fy = fieldValues.fy;
    if (activeFields.projectType) updateData.projectType = fieldValues.projectType;
    if (activeFields.aiDx) updateData.aiDx = fieldValues.aiDx;
    if (activeFields.inhouse) updateData.inhouse = fieldValues.inhouse;
    if (activeFields.investmentMrs) updateData.investmentMrs = parseFloat(fieldValues.investmentMrs) || 0;
    if (activeFields.manhourSavings) updateData.manhourSavings = parseFloat(fieldValues.manhourSavings) || 0;

    const ids = selectedProjects.map(p => p.id);

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/projects/bulk`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ids, updateData })
      });


      const data = await response.json();

      if (data.success) {
        showToast(`Successfully bulk updated ${selectedCount} project(s)!`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast(data.message || 'Bulk edit failed.', 'error');
      }
    } catch (err) {
      showToast('Failed to connect to backend for bulk edit.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] transition-colors ${isDark ? 'bg-[#0d1017] border-[#1e2430] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}>

        {/* Header Bar */}
        <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-[#181c24] bg-[#080a0f]' : 'border-slate-100 bg-slate-50'
          }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#2dd4bf] flex items-center justify-center text-[#06080b] shadow-md shadow-[#2dd4bf]/20">
              <Edit3 className="w-5 h-5 font-black" />
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bulk Edit Selected Projects
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Updating <strong className={isDark ? 'text-white' : 'text-slate-900'}>{selectedCount}</strong> selected project(s). Unchecked fields will remain untouched.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-[#07090d] hover:bg-[#141a24] border-[#1e2430] text-slate-400 hover:text-white' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500'
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Select the field(s) you wish to modify:
          </p>

          {/* Fields Selection & Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Status */}
            <div className={`p-4 rounded-2xl border transition-all ${activeFields.status
                ? isDark ? 'bg-[#0f241e] border-[#2dd4bf]/60' : 'bg-teal-50 border-teal-300'
                : isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'
              }`}>
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={activeFields.status}
                  onChange={() => toggleField('status')}
                  className="w-4 h-4 rounded text-[#2dd4bf] focus:ring-0 accent-[#2dd4bf]"
                />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Project Status</span>
              </label>

              {activeFields.status && (
                <select
                  value={fieldValues.status}
                  onChange={(e) => handleValueChange('status', e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold focus:outline-none border ${isDark ? 'bg-[#080a0f] border-[#2dd4bf] text-white' : 'bg-white border-teal-500 text-slate-900'
                    }`}
                >
                  {(lookups.statuses || ['Live', 'TBS to be started', 'Engaged']).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Division */}
            <div className={`p-4 rounded-2xl border transition-all ${activeFields.division
                ? isDark ? 'bg-[#0f241e] border-[#2dd4bf]/60' : 'bg-teal-50 border-teal-300'
                : isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'
              }`}>
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={activeFields.division}
                  onChange={() => toggleField('division')}
                  className="w-4 h-4 rounded text-[#2dd4bf] focus:ring-0 accent-[#2dd4bf]"
                />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Division</span>
              </label>

              {activeFields.division && (
                <select
                  value={fieldValues.division}
                  onChange={(e) => handleValueChange('division', e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold focus:outline-none border ${isDark ? 'bg-[#080a0f] border-[#2dd4bf] text-white' : 'bg-white border-teal-500 text-slate-900'
                    }`}
                >
                  <option value="">Select Division...</option>
                  {(lookups.divisions || []).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Category */}
            <div className={`p-4 rounded-2xl border transition-all ${activeFields.category
                ? isDark ? 'bg-[#0f241e] border-[#2dd4bf]/60' : 'bg-teal-50 border-teal-300'
                : isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'
              }`}>
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={activeFields.category}
                  onChange={() => toggleField('category')}
                  className="w-4 h-4 rounded text-[#2dd4bf] focus:ring-0 accent-[#2dd4bf]"
                />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Category</span>
              </label>

              {activeFields.category && (
                <select
                  value={fieldValues.category}
                  onChange={(e) => handleValueChange('category', e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold focus:outline-none border ${isDark ? 'bg-[#080a0f] border-[#2dd4bf] text-white' : 'bg-white border-teal-500 text-slate-900'
                    }`}
                >
                  <option value="">Select Category...</option>
                  {(lookups.categories || []).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Financial Year */}
            <div className={`p-4 rounded-2xl border transition-all ${activeFields.fy
                ? isDark ? 'bg-[#0f241e] border-[#2dd4bf]/60' : 'bg-teal-50 border-teal-300'
                : isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'
              }`}>
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={activeFields.fy}
                  onChange={() => toggleField('fy')}
                  className="w-4 h-4 rounded text-[#2dd4bf] focus:ring-0 accent-[#2dd4bf]"
                />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Financial Year (FY)</span>
              </label>

              {activeFields.fy && (
                <select
                  value={fieldValues.fy}
                  onChange={(e) => handleValueChange('fy', e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold focus:outline-none border ${isDark ? 'bg-[#080a0f] border-[#2dd4bf] text-white' : 'bg-white border-teal-500 text-slate-900'
                    }`}
                >
                  {(lookups.fys || ['FY 22-23', 'FY 23-24', 'FY 24-25', 'FY 25-26', 'FY 26-27']).map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Project Type */}
            <div className={`p-4 rounded-2xl border transition-all ${activeFields.projectType
                ? isDark ? 'bg-[#0f241e] border-[#2dd4bf]/60' : 'bg-teal-50 border-teal-300'
                : isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'
              }`}>
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={activeFields.projectType}
                  onChange={() => toggleField('projectType')}
                  className="w-4 h-4 rounded text-[#2dd4bf] focus:ring-0 accent-[#2dd4bf]"
                />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Project Type</span>
              </label>

              {activeFields.projectType && (
                <select
                  value={fieldValues.projectType}
                  onChange={(e) => handleValueChange('projectType', e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold focus:outline-none border ${isDark ? 'bg-[#080a0f] border-[#2dd4bf] text-white' : 'bg-white border-teal-500 text-slate-900'
                    }`}
                >
                  <option value="">Select Project Type...</option>
                  {(lookups.projectTypes || []).map(pt => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Investment MRs */}
            <div className={`p-4 rounded-2xl border transition-all ${activeFields.investmentMrs
                ? isDark ? 'bg-[#0f241e] border-[#2dd4bf]/60' : 'bg-teal-50 border-teal-300'
                : isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'
              }`}>
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={activeFields.investmentMrs}
                  onChange={() => toggleField('investmentMrs')}
                  className="w-4 h-4 rounded text-[#2dd4bf] focus:ring-0 accent-[#2dd4bf]"
                />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Capital Investment (MRs)</span>
              </label>

              {activeFields.investmentMrs && (
                <input
                  type="number"
                  step="0.1"
                  value={fieldValues.investmentMrs}
                  onChange={(e) => handleValueChange('investmentMrs', e.target.value)}
                  placeholder="e.g. 2.5"
                  className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none border ${isDark ? 'bg-[#080a0f] border-[#2dd4bf] text-amber-300' : 'bg-white border-teal-500 text-amber-700'
                    }`}
                />
              )}
            </div>

          </div>

          {/* Diff Preview of Selected Projects */}
          {anyFieldSelected && (
            <div className="space-y-3 pt-2">
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Proposed Changes Preview:
              </h3>
              <div className={`p-4 rounded-2xl border font-mono text-xs max-h-[160px] overflow-y-auto space-y-2 ${isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'
                }`}>
                {selectedProjects.map(p => (
                  <div key={p.id} className="flex items-center justify-between border-b pb-1.5 border-[#181c24] last:border-0 last:pb-0">
                    <span className="font-bold text-slate-300">{p.project_code} ({p.project_name})</span>
                    <span className="text-[#2dd4bf] font-bold">
                      {Object.keys(activeFields).filter(k => activeFields[k]).map(k => `${k}: "${fieldValues[k]}"`).join(' | ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className={`p-6 border-t flex items-center justify-between ${isDark ? 'border-[#181c24] bg-[#080a0f]' : 'border-slate-100 bg-slate-50'
          }`}>
          <button
            onClick={onClose}
            disabled={submitting}
            className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all ${isDark ? 'bg-[#07090d] hover:bg-[#141a24] border-[#1e2430] text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || !anyFieldSelected}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-[#2dd4bf] hover:bg-[#26bba8] text-[#06080b] font-black text-xs shadow-lg shadow-[#2dd4bf]/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent border-[#06080b] rounded-full animate-spin"></div>
                <span>Executing Bulk Update...</span>
              </>
            ) : (
              <>
                <span>Apply Bulk Changes ({selectedCount} projects)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default BulkEditModal;
