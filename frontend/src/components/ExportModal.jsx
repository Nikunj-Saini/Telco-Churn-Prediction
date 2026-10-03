import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, X, Check, ArrowRight, Database, Filter, CheckSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const ExportModal = ({
  isOpen,
  onClose,
  selectedCount = 0,
  filteredCount = 0,
  totalCount = 0,
  selectedProjects = [],
  projects = [],
  apiBaseUrl = 'http://localhost:5000/api',
  activeFilters = {},
  showToast
}) => {
  const { isDark } = useTheme();
  const { getAuthHeaders } = useAuth();

  const isFilterActive = Object.values(activeFilters).some(v => Array.isArray(v) ? v.length > 0 : !!v) || (filteredCount > 0 && filteredCount < totalCount);

  // Export Options State
  const [exportScope, setExportScope] = useState(() => {
    if (selectedCount > 0) return 'selected';
    if (isFilterActive) return 'filtered';
    return 'all';
  });
  const [exportFormat, setExportFormat] = useState('xlsx'); // 'xlsx' | 'csv'
  const [limitMode, setLimitMode] = useState('all'); // 'all' | 'custom'
  const [customLimit, setCustomLimit] = useState(100);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (selectedCount > 0) {
        setExportScope('selected');
      } else if (isFilterActive) {
        setExportScope('filtered');
      } else {
        setExportScope('all');
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, selectedCount, filteredCount, totalCount, activeFilters, isFilterActive]);

  if (!isOpen) return null;

  const handleExecuteExport = async () => {
    setExporting(true);
    try {
      let rawData = [];

      if (exportScope === 'selected' && selectedCount > 0) {
        rawData = selectedProjects;
      } else if (exportScope === 'filtered') {
        // Fetch filtered data matching active search & dropdown filters
        const formatParam = (v) => Array.isArray(v) ? v.join(',') : (v || '');
        const params = new URLSearchParams();
        if (activeFilters.search) params.append('search', activeFilters.search);
        if (activeFilters.division && (Array.isArray(activeFilters.division) ? activeFilters.division.length > 0 : activeFilters.division)) {
          params.append('division', formatParam(activeFilters.division));
        }
        if (activeFilters.category && (Array.isArray(activeFilters.category) ? activeFilters.category.length > 0 : activeFilters.category)) {
          params.append('category', formatParam(activeFilters.category));
        }
        if (activeFilters.projectType && (Array.isArray(activeFilters.projectType) ? activeFilters.projectType.length > 0 : activeFilters.projectType)) {
          params.append('project_type', formatParam(activeFilters.projectType));
        }
        if (activeFilters.status && (Array.isArray(activeFilters.status) ? activeFilters.status.length > 0 : activeFilters.status)) {
          params.append('status', formatParam(activeFilters.status));
        }
        if (activeFilters.fy && (Array.isArray(activeFilters.fy) ? activeFilters.fy.length > 0 : activeFilters.fy)) {
          params.append('fy', formatParam(activeFilters.fy));
        }
        if (activeFilters.createdBy && (Array.isArray(activeFilters.createdBy) ? activeFilters.createdBy.length > 0 : activeFilters.createdBy)) {
          params.append('createdBy', formatParam(activeFilters.createdBy));
        }

        const res = await fetch(`${apiBaseUrl}/projects/export?${params.toString()}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          rawData = data.data;
        } else {
          rawData = projects;
        }
      } else {
        // 'all' scope: Fetch full database dataset (no params)
        const res = await fetch(`${apiBaseUrl}/projects/export`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          rawData = data.data;
        } else {
          rawData = projects;
        }
      }


      // Apply custom limit if specified
      if (limitMode === 'custom' && customLimit > 0) {
        rawData = rawData.slice(0, parseInt(customLimit));
      }

      if (!rawData || rawData.length === 0) {
        showToast('No project records found matching your selection.', 'error');
        setExporting(false);
        return;
      }

      // Sort dataset in ascending order by Project ID (1, 2, 3...)
      rawData.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

      // Format all data columns
      const exportData = rawData.map(p => {
        const ys = p.yearly_savings || {};
        return {
          'Project Code': p.project_code || '',
          'Project Name': p.project_name || '',
          'Division': p.division || '',
          'Category': p.category || '',
          'Project Type': p.project_type || '',
          'Status': p.status || '',
          'Base Financial Year': p.fy || '',
          'AI / DX': p.ai_dx || 'DX',
          'Parent / Child': p.project_type_parent_child || 'Parent',
          'Flagship': p.fship || 'N',
          'Inhouse': p.inhouse || 'DIV',
          'Capital Investment (MRs)': Number(p.investment_mrs) || 0,
          'Live Target Date': p.live_target || '',
          'Live Actual Date': p.live_actual || '',
          'PDD Count': Number(p.pdd_count) || 0,
          'Use Cases Count': Number(p.use_cases_count) || 0,
          'Slides Count': Number(p.slides) || 0,
          'Total Manhours Saved (Hrs/Yr)': Number(p.total_manhours_saved) || 0,
          'Total Cost Savings (MRs)': Number(p.total_cost_saving_mrs) || 0,
          'FY 22-23 Hours': Number(ys['FY 22-23']?.manhours_saved) || 0,
          'FY 22-23 Savings (MRs)': Number(ys['FY 22-23']?.total_cost_saving_mrs) || 0,
          'FY 23-24 Hours': Number(ys['FY 23-24']?.manhours_saved) || 0,
          'FY 23-24 Savings (MRs)': Number(ys['FY 23-24']?.total_cost_saving_mrs) || 0,
          'FY 24-25 Hours': Number(ys['FY 24-25']?.manhours_saved) || 0,
          'FY 24-25 Savings (MRs)': Number(ys['FY 24-25']?.total_cost_saving_mrs) || 0,
          'FY 25-26 Hours': Number(ys['FY 25-26']?.manhours_saved) || 0,
          'FY 25-26 Savings (MRs)': Number(ys['FY 25-26']?.total_cost_saving_mrs) || 0,
          'FY 26-27 Hours': Number(ys['FY 26-27']?.manhours_saved) || 0,
          'FY 26-27 Savings (MRs)': Number(ys['FY 26-27']?.total_cost_saving_mrs) || 0,
          'Created At': p.created_at || '',
          'Updated At': p.updated_at || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Projects');

      const fileExtension = exportFormat === 'csv' ? 'csv' : 'xlsx';
      const bookType = exportFormat === 'csv' ? 'csv' : 'xlsx';
      const mimeType = exportFormat === 'csv'
        ? 'text/csv;charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

      const excelBuffer = XLSX.write(wb, { bookType, type: 'array' });
      const blob = new Blob([excelBuffer], { type: mimeType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ROI_Projects_Export_${new Date().toISOString().substring(0, 10)}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast(`Exported ${exportData.length} project record(s) as .${fileExtension.toUpperCase()}!`, 'success');
      onClose();
    } catch (err) {
      console.error('Export Error:', err);
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className={`relative w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] transition-colors ${isDark ? 'bg-[#0d1017] border-[#1e2430] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}>

        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-[#181c24] bg-[#080a0f]' : 'border-slate-100 bg-slate-50'
          }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#2dd4bf] flex items-center justify-center text-[#06080b] shadow-md shadow-[#2dd4bf]/20">
              <Download className="w-5 h-5 font-black" />
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Export Data Options
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Choose what records, count, and format you want to export
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

        {/* Options Body */}
        <div className="p-6 space-y-5">

          {/* Section 1: Select Export Scope */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              1. Select Which Records To Export:
            </label>

            <div className="space-y-2.5">
              {/* Option A: Selected Checkboxes (if any) */}
              {selectedCount > 0 && (
                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${exportScope === 'selected'
                  ? isDark ? 'bg-[#0f241e] border-[#2dd4bf]/60' : 'bg-teal-50 border-teal-300'
                  : isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'selected'}
                      onChange={() => setExportScope('selected')}
                      className="w-4 h-4 text-[#2dd4bf] accent-[#2dd4bf]"
                    />
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#2dd4bf]" />
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Selected Projects Only
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#2dd4bf]/20 text-[#2dd4bf]">
                    {selectedCount} selected
                  </span>
                </label>
              )}



              {/* Option B: Filtered Active Results */}
              <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${exportScope === 'filtered'
                ? isDark ? 'bg-[#0f241e] border-[#2dd4bf]/60' : 'bg-teal-50 border-teal-300'
                : isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'
                }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'filtered'}
                    onChange={() => setExportScope('filtered')}
                    className="w-4 h-4 text-[#2dd4bf] accent-[#2dd4bf]"
                  />
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-amber-400" />
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Filtered Active Results Only {isFilterActive ? '(Filters Active)' : ''}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300">
                  {filteredCount} matching filters
                </span>
              </label>

              {/* Option C: Entire Database */}
              <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${exportScope === 'all'
                ? isDark ? 'bg-[#0f241e] border-[#2dd4bf]/60' : 'bg-teal-50 border-teal-300'
                : isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'
                }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'all'}
                    onChange={() => setExportScope('all')}
                    className="w-4 h-4 text-[#2dd4bf] accent-[#2dd4bf]"
                  />
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Entire SQLite Database (All Projects)
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400">
                  {totalCount} total in DB
                </span>
              </label>

            </div>
          </div>

          {/* Section 2: Row Count Limit Option */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              2. How Many Records To Export:
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLimitMode('all')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all ${limitMode === 'all'
                  ? isDark ? 'bg-[#121620] text-[#2dd4bf] border-[#2dd4bf]/60' : 'bg-teal-50 text-teal-700 border-teal-300'
                  : isDark ? 'bg-[#07090d] border-[#1e2430] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
              >
                All Records
              </button>

              <button
                type="button"
                onClick={() => setLimitMode('custom')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all ${limitMode === 'custom'
                  ? isDark ? 'bg-[#121620] text-[#2dd4bf] border-[#2dd4bf]/60' : 'bg-teal-50 text-teal-700 border-teal-300'
                  : isDark ? 'bg-[#07090d] border-[#1e2430] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
              >
                Custom Limit...
              </button>
            </div>

            {limitMode === 'custom' && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">Export Top:</span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={customLimit}
                  onChange={(e) => setCustomLimit(e.target.value)}
                  className={`w-28 p-2 rounded-xl text-xs font-mono font-bold border focus:outline-none ${isDark ? 'bg-[#07090d] border-[#2dd4bf] text-white' : 'bg-white border-teal-500 text-slate-900'
                    }`}
                />
                <span className="text-xs font-medium text-slate-400">records</span>
              </div>
            )}
          </div>

          {/* Section 3: Format */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              3. File Format:
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('xlsx')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${exportFormat === 'xlsx'
                  ? isDark ? 'bg-[#0f241e] text-[#2dd4bf] border-[#2dd4bf]/60' : 'bg-teal-50 text-teal-700 border-teal-300'
                  : isDark ? 'bg-[#07090d] border-[#1e2430] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${exportFormat === 'csv'
                  ? isDark ? 'bg-[#0f241e] text-[#2dd4bf] border-[#2dd4bf]/60' : 'bg-teal-50 text-teal-700 border-teal-300'
                  : isDark ? 'bg-[#07090d] border-[#1e2430] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
              >
                <Download className="w-4 h-4" />
                <span>CSV (.csv)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex items-center justify-between ${isDark ? 'border-[#181c24] bg-[#080a0f]' : 'border-slate-100 bg-slate-50'
          }`}>
          <button
            onClick={onClose}
            disabled={exporting}
            className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all ${isDark ? 'bg-[#07090d] hover:bg-[#141a24] border-[#1e2430] text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteExport}
            disabled={exporting}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-[#2dd4bf] hover:bg-[#26bba8] text-[#06080b] font-black text-xs shadow-lg shadow-[#2dd4bf]/20 transition-all active:scale-95 disabled:opacity-40"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent border-[#06080b] rounded-full animate-spin"></div>
                <span>Generating Export...</span>
              </>
            ) : (
              <>
                <span>Download {exportFormat.toUpperCase()} File</span>
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

export default ExportModal;
