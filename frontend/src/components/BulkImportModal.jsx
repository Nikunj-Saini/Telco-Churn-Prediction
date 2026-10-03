import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import {
  Upload, Clipboard, FileSpreadsheet, AlertCircle, CheckCircle2,
  X, ArrowRight, RefreshCw, FileText, Check, AlertTriangle, Layers
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const DEFAULT_COLUMN_FIELDS = [
  'project_code',
  'projectName',
  'division',
  'category',
  'status',
  'fy',
  'investmentMrs',
  'manhourSavings',
  'projectType',
  'aiDx',
  'inhouse',
  'fship'
];

const FIELD_DEFINITIONS = [
  { key: 'project_code', label: 'Project Code (VU Code)' },
  { key: 'projectName', label: 'Project Name' },
  { key: 'division', label: 'Division' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'fy', label: 'FY (Financial Year)' },
  { key: 'investmentMrs', label: 'Investment (MRs)' },
  { key: 'manhourSavings', label: 'Manhours Saved / Yr' },
  { key: 'projectType', label: 'Project Type' },
  { key: 'aiDx', label: 'AI / DX' },
  { key: 'inhouse', label: 'Inhouse / Vendor' },
  { key: 'fship', label: 'Flagship' },
  { key: 'ignore', label: '-- Skip / Ignore Column --' }
];

const HEADER_KEYWORDS = ['code', 'name', 'division', 'category', 'status', 'fy', 'investment', 'manhour', 'hours', 'type', 'vucode', 'div', 'cat'];

const detectHeaders = (firstRow) => {
  if (!firstRow || !Array.isArray(firstRow)) return false;
  let matches = 0;
  firstRow.forEach(cell => {
    const val = String(cell).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (HEADER_KEYWORDS.some(k => val.includes(k))) {
      matches++;
    }
  });
  return matches >= 2;
};

const mapHeaderToField = (headerStr) => {
  if (!headerStr) return 'ignore';
  const clean = String(headerStr).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('code') || clean.includes('vucode') || clean === 'id') return 'project_code';
  if (clean.includes('name') || clean.includes('title') || clean === 'project') return 'projectName';
  if (clean.includes('div')) return 'division';
  if (clean.includes('cat')) return 'category';
  if (clean.includes('stat')) return 'status';
  if (clean.includes('fy') || clean.includes('year')) return 'fy';
  if (clean.includes('invest') || clean.includes('capital') || clean.includes('mrs')) return 'investmentMrs';
  if (clean.includes('manhour') || clean.includes('hour') || clean.includes('saving')) return 'manhourSavings';
  if (clean.includes('type')) return 'projectType';
  if (clean.includes('aidx') || clean === 'ai') return 'aiDx';
  if (clean.includes('house')) return 'inhouse';
  if (clean.includes('flag') || clean.includes('fship')) return 'fship';
  return 'ignore';
};

const parseMatrixFromText = (rawText) => {
  if (!rawText || !rawText.trim()) return [];

  let text = rawText.trim();
  if (!text.includes('\t') && !text.includes(',')) {
    text = text.split('\n').map(line => line.trim().replace(/ {2,}/g, '\t')).join('\n');
  }

  try {
    const workbook = XLSX.read(text, { type: 'string' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
    return matrix.filter(row => Array.isArray(row) && row.some(cell => String(cell).trim() !== ''));
  } catch (err) {
    return text.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        if (line.includes('\t')) return line.split('\t').map(c => c.trim());
        if (line.includes(',')) return line.split(',').map(c => c.trim());
        return line.split(/ {2,}/).map(c => c.trim());
      });
  }
};

const BulkImportModal = ({ isOpen, onClose, onSuccess, apiBaseUrl = 'http://localhost:5000/api', showToast }) => {
  const { isDark } = useTheme();
  const { user, getAuthHeaders } = useAuth();

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState(null);

  // Column mapping & header states
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [manualHeaderToggle, setManualHeaderToggle] = useState(false);
  const [customColMap, setCustomColMap] = useState({});
  const [customValueOverrides, setCustomValueOverrides] = useState({});

  // Parsed and validated rows
  const [parsedRows, setParsedRows] = useState([]);
  const [existingProjects, setExistingProjects] = useState([]);
  const [existingCodes, setExistingCodes] = useState(new Set());
  const [existingIds, setExistingIds] = useState(new Set());
  const [existingNames, setExistingNames] = useState(new Set());
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);


  // Fetch existing project codes, IDs, and names from backend for instant duplicate / update detection
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchExistingCodes();
      setParsedRows([]);
      setFile(null);
      setPastedText('');
      setHasHeaderRow(true);
      setManualHeaderToggle(false);
      setCustomColMap({});
      setCustomValueOverrides({});
      setResultSummary(null);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchExistingCodes = async () => {
    setLoadingLookups(true);
    try {
      const res = await fetch(`${apiBaseUrl}/projects/export`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setExistingProjects(data.data);
        const codes = new Set(data.data.map(p => (p.project_code || '').trim().toUpperCase()).filter(Boolean));
        const ids = new Set(data.data.map(p => String(p.id || '')).filter(Boolean));
        const names = new Set(data.data.map(p => (p.project_name || '').trim().toLowerCase()).filter(Boolean));
        setExistingCodes(codes);
        setExistingIds(ids);
        setExistingNames(names);
      }
    } catch (err) {
      console.error('Failed to fetch existing project references:', err);
    } finally {
      setLoadingLookups(false);
    }
  };


  // Helper to auto-capitalize/format text entries (e.g. vu -> VU, digitalization -> Digitalization)
  const formatCapitalCase = (val, fieldType = 'text') => {
    if (!val || typeof val !== 'string') return val || '';
    const trimmed = val.trim();
    if (!trimmed) return '';

    if (fieldType === 'code' || fieldType === 'division' || fieldType === 'inhouse' || fieldType === 'aidx' || fieldType === 'fship') {
      return trimmed.toUpperCase();
    }

    if (fieldType === 'fy') {
      let upper = trimmed.toUpperCase();
      if (!upper.startsWith('FY') && /^\d{2}-\d{2}$/.test(upper)) {
        upper = `FY ${upper}`;
      }
      return upper;
    }

    if (fieldType === 'category' || fieldType === 'projectType' || fieldType === 'status' || fieldType === 'name') {
      const lower = trimmed.toLowerCase();
      if (lower === 'digitalization') return 'Digitalization';
      if (lower === 'powerapps & portal' || lower === 'powerapps' || lower === 'power apps') return 'PowerApps & Portal';
      if (lower === 'analytics') return 'Analytics';
      if (lower === 'automation') return 'Automation';

      if (lower === 'live') return 'Live';
      if (lower === 'engaged') return 'Engaged';
      if (lower.includes('tbs') || lower.includes('be started')) return 'TBS to be started';
      if (lower.includes('to be engaged')) return 'To be engaged';
      if (lower.includes('pcc')) return 'PCC not converted';

      return trimmed.replace(/\b\w/g, char => char.toUpperCase());
    }

    return trimmed;
  };

  // Header mapping dictionary to handle various Excel/CSV column names
  const normalizeRow = (rawRow) => {
    const row = {};
    Object.keys(rawRow).forEach(k => {
      const cleanKey = k.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      row[cleanKey] = rawRow[k];
    });

    const getValue = (...keys) => {
      for (const key of keys) {
        const clean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (row[clean] !== undefined && row[clean] !== null) {
          return String(row[clean]).trim();
        }
      }
      return '';
    };

    const getNumber = (...keys) => {
      const val = getValue(...keys);
      if (!val) return 0;
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : num;
    };

    const id = getValue('projectid', 'id');
    const rawCode = getValue('projectcode', 'code', 'vucode') || (id && String(id).toUpperCase().startsWith('VU-') ? id : '');
    const project_code = formatCapitalCase(rawCode, 'code');
    const projectName = formatCapitalCase(getValue('projectname', 'name', 'project', 'title'), 'name');
    const division = formatCapitalCase(getValue('division', 'div'), 'division');
    const category = formatCapitalCase(getValue('category', 'cat'), 'category');
    const projectType = formatCapitalCase(getValue('projecttype', 'type'), 'projectType');
    const aiDx = formatCapitalCase(getValue('aidx', 'aidxtype', 'ai') || 'DX', 'aidx');
    const status = formatCapitalCase(getValue('status', 'state') || 'TBS to be started', 'status');
    const fy = formatCapitalCase(getValue('fy', 'financialyear', 'basefinancialyear', 'year') || 'FY 24-25', 'fy');
    const inhouse = formatCapitalCase(getValue('inhouse', 'house') || 'DIV', 'inhouse');
    const fship = formatCapitalCase(getValue('fship', 'flagship') || 'N', 'fship');
    const rawParentChild = getValue('projecttypeparentchild', 'parentchild') || 'Parent';
    const projectTypeParentChild = formatCapitalCase(rawParentChild, 'projectType');

    const investmentMrs = getNumber('capitalinvestmentmrs', 'investmentmrs', 'investment', 'capital');
    const manhourSavings = getNumber(
      'totalmanhourssavedhrsyr',
      'manhourssavedhrsyr',
      'totalmanhourssaved',
      'manhourssaved',
      'manhoursaved',
      'manhours',
      'hourssaved',
      'manhoursavings'
    );

    const availableFys = ['FY 22-23', 'FY 23-24', 'FY 24-25', 'FY 25-26', 'FY 26-27'];
    const yearlySavings = availableFys.map(year => {
      const yearClean = year.toLowerCase().replace(/[^a-z0-9]/g, '');
      const hrsKey = `${yearClean}hours`;
      const hrsVal = getNumber(hrsKey, `${yearClean}manhours`, `${yearClean}manhourssaved`);
      return {
        fy: year,
        manhoursSaved: hrsVal || manhourSavings
      };
    });

    return {
      id,
      project_code,
      projectName,
      division,
      category,
      projectType,
      aiDx,
      status,
      fy,
      inhouse,
      fship,
      projectTypeParentChild,
      investmentMrs,
      manhourSavings,
      yearlySavings
    };
  };

  // Validate parsed rows
  const validateRows = (rawRows) => {
    // Track count of occurrences of project_code in the uploaded dataset
    const codeCounts = {};
    rawRows.forEach(raw => {
      const norm = normalizeRow(raw);
      if (norm.project_code) {
        const c = norm.project_code.toUpperCase();
        codeCounts[c] = (codeCounts[c] || 0) + 1;
      }
    });

    // Track DB project IDs already matched/claimed by earlier rows in this import batch
    const claimedDbProjectIds = new Set();

    return rawRows.map((raw, idx) => {
      const normalized = normalizeRow(raw);
      let statusType = 'INSERT';
      let reason = '';
      let matchedProject = null;

      // 1. Primary check: Match by exact Project Code if provided and matches an unclaimed DB project
      if (normalized.project_code) {
        const codeMatch = existingProjects.find(p =>
          !claimedDbProjectIds.has(p.id) &&
          p.project_code && p.project_code.toUpperCase() === normalized.project_code.toUpperCase()
        );
        if (codeMatch) {
          matchedProject = codeMatch;
        }
      }

      // 2. Secondary check: Match by exact DB ID if provided and matches an unclaimed DB project
      if (!matchedProject && normalized.id) {
        const idMatch = existingProjects.find(p =>
          !claimedDbProjectIds.has(p.id) && String(p.id) === String(normalized.id)
        );
        if (idMatch) {
          matchedProject = idMatch;
        }
      }

      // 3. Tertiary check: Match by exact Project Name if provided and matches an unclaimed DB project
      if (!matchedProject && normalized.projectName) {
        const nameMatch = existingProjects.find(p =>
          !claimedDbProjectIds.has(p.id) &&
          p.project_name && p.project_name.toLowerCase() === normalized.projectName.toLowerCase()
        );
        if (nameMatch) {
          matchedProject = nameMatch;
        }
      }

      if (!normalized.projectName) {
        statusType = 'INVALID';
        reason = 'Missing Project Name';
      } else if (matchedProject) {
        claimedDbProjectIds.add(matchedProject.id);
        if (user?.role !== 'admin' && Number(matchedProject.created_by_user_id) !== Number(user?.id)) {
          statusType = 'INVALID';
          reason = `Owned by ${matchedProject.created_by_name || 'another user'} (Cannot overwrite)`;
        } else {
          statusType = 'UPDATE';
          normalized.id = matchedProject.id;
        }
      } else if (normalized.investmentMrs < 0 || normalized.manhourSavings < 0) {
        statusType = 'INVALID';
        reason = 'Negative numbers not allowed';
      } else {
        // New INSERT row! Clear copied ID and copied project_code if it already exists in DB
        statusType = 'INSERT';
        if (normalized.project_code) {
          const codeExistsInDb = existingProjects.some(p => p.project_code && p.project_code.toUpperCase() === normalized.project_code.toUpperCase());
          if (codeExistsInDb) {
            normalized.project_code = ''; // clear copied code so backend auto-generates a new unique code
          }
        }
        normalized.id = ''; // clear copied ID for new insert
      }

      return {
        rowNum: idx + 1,
        ...normalized,
        statusType,
        reason
      };
    });
  };


  // Handle File Upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          showToast('Uploaded file contains no data rows.', 'error');
          return;
        }

        const validated = validateRows(json);
        setParsedRows(validated);
      } catch (err) {
        console.error('File parsing error:', err);
        showToast('Failed to parse file. Please ensure it is a valid Excel or CSV file.', 'error');
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
    e.target.value = '';
  };

  // Live parsing & column mapping for pasted text
  useEffect(() => {
    if (activeTab !== 'paste') return;
    if (!pastedText.trim()) {
      setParsedRows([]);
      return;
    }

    const matrix = parseMatrixFromText(pastedText);
    if (matrix.length === 0) {
      setParsedRows([]);
      return;
    }

    let isHeader = hasHeaderRow;
    if (!manualHeaderToggle) {
      isHeader = detectHeaders(matrix[0]);
      setHasHeaderRow(isHeader);
    }

    const colCount = Math.max(...matrix.map(r => r.length));
    const effectiveMap = [];
    for (let i = 0; i < colCount; i++) {
      if (customColMap[i] !== undefined) {
        effectiveMap[i] = customColMap[i];
      } else if (isHeader && matrix[0] && matrix[0][i]) {
        effectiveMap[i] = mapHeaderToField(matrix[0][i]);
      } else {
        effectiveMap[i] = DEFAULT_COLUMN_FIELDS[i] || 'ignore';
      }
    }

    const dataRows = isHeader ? matrix.slice(1) : matrix;
    const rawObjects = dataRows.map((rowCells, rIdx) => {
      const rawObj = {};
      rowCells.forEach((cellVal, colIdx) => {
        const fieldKey = effectiveMap[colIdx] || 'ignore';
        if (fieldKey && fieldKey !== 'ignore') {
          const effectiveVal = (rIdx === 0 && customValueOverrides[colIdx] !== undefined)
            ? customValueOverrides[colIdx]
            : cellVal;
          rawObj[fieldKey] = effectiveVal;
        }
      });
      return rawObj;
    });

    const validated = validateRows(rawObjects);
    setParsedRows(validated);
  }, [pastedText, activeTab, hasHeaderRow, manualHeaderToggle, customColMap, customValueOverrides, existingProjects]);

  const handlePasteProcess = () => {
    if (!pastedText.trim()) {
      showToast('Please paste data into the text box first.', 'error');
      return;
    }
    const matrix = parseMatrixFromText(pastedText);
    if (matrix.length === 0) {
      showToast('No structured rows detected in pasted text.', 'error');
      return;
    }
    showToast(`Successfully parsed and validated ${parsedRows.length} rows!`, 'success');
  };

  const pastedMatrix = activeTab === 'paste' ? parseMatrixFromText(pastedText) : [];
  const detectedColCount = pastedMatrix.length > 0 ? Math.max(...pastedMatrix.map(r => r.length)) : 0;
  const sampleDataRow = pastedMatrix.length > 0
    ? (hasHeaderRow ? (pastedMatrix[1] || pastedMatrix[0]) : pastedMatrix[0])
    : [];

  const currentEffectiveColMap = [];
  for (let i = 0; i < detectedColCount; i++) {
    if (customColMap[i] !== undefined) {
      currentEffectiveColMap[i] = customColMap[i];
    } else if (hasHeaderRow && pastedMatrix[0] && pastedMatrix[0][i]) {
      currentEffectiveColMap[i] = mapHeaderToField(pastedMatrix[0][i]);
    } else {
      currentEffectiveColMap[i] = DEFAULT_COLUMN_FIELDS[i] || 'ignore';
    }
  }

  const handleColMapChange = (colIdx, fieldKey) => {
    setCustomColMap(prev => ({
      ...prev,
      [colIdx]: fieldKey
    }));
  };

  // Submit valid rows to backend
  const handleSubmit = async () => {
    const validRows = parsedRows.filter(r => r.statusType !== 'INVALID');
    if (validRows.length === 0) {
      showToast('No valid rows available to import.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/projects/bulk`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ projects: validRows })
      });


      const data = await response.json();

      if (data.success) {
        setResultSummary(data);
        showToast(data.message || 'Bulk import processed successfully!', 'success');
        if (onSuccess) onSuccess();
      } else {
        showToast(data.message || 'Bulk import failed.', 'error');
      }
    } catch (err) {
      showToast('Failed to connect to backend for bulk import.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const validCount = parsedRows.filter(r => r.statusType !== 'INVALID').length;
  const insertCount = parsedRows.filter(r => r.statusType === 'INSERT').length;
  const updateCount = parsedRows.filter(r => r.statusType === 'UPDATE').length;
  const invalidCount = parsedRows.filter(r => r.statusType === 'INVALID').length;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className={`relative w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] transition-colors ${isDark ? 'bg-[#0d1017] border-[#1e2430] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}>

        {/* Header Bar */}
        <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-[#181c24] bg-[#080a0f]' : 'border-slate-100 bg-slate-50'
          }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#2dd4bf] flex items-center justify-center text-[#06080b] shadow-md shadow-[#2dd4bf]/20">
              <FileSpreadsheet className="w-5 h-5 font-black" />
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bulk Import & Data Management
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Upload Excel / CSV file or paste tabular data to insert new projects or update existing ones
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

          {/* Result Summary Overlay if finished */}
          {resultSummary ? (
            <div className="p-8 text-center space-y-5 animate-slide-up">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bulk Import Completed!
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-xs text-slate-400 uppercase font-bold">New Projects Added</p>
                  <p className="text-3xl font-black text-emerald-400 mt-1 font-mono">{resultSummary.insertedCount}</p>
                </div>
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-xs text-slate-400 uppercase font-bold">Existing Updated</p>
                  <p className="text-3xl font-black text-sky-400 mt-1 font-mono">{resultSummary.updatedCount}</p>
                </div>
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-xs text-slate-400 uppercase font-bold">Rows Failed / Skipped</p>
                  <p className="text-3xl font-black text-rose-400 mt-1 font-mono">{resultSummary.failedCount}</p>
                </div>
              </div>

              {resultSummary.errors && resultSummary.errors.length > 0 && (
                <div className={`p-4 rounded-2xl border text-left max-w-xl mx-auto space-y-2 ${isDark ? 'bg-[#260f14] border-rose-600/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                  <p className="text-xs font-bold uppercase">Skipped Row Details:</p>
                  <ul className="text-xs space-y-1 font-mono">
                    {resultSummary.errors.map((err, idx) => (
                      <li key={idx}>Row {err.row}: {err.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-[#2dd4bf] hover:bg-[#26bba8] text-[#06080b] font-black text-sm shadow-lg shadow-[#2dd4bf]/20 transition-all"
              >
                Close & Return to List
              </button>
            </div>
          ) : (
            <>
              {/* Input Method Switcher Tabs */}
              <div className="flex items-center gap-3 border-b pb-4 border-[#1e2430]">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'upload'
                      ? isDark
                        ? 'bg-[#121620] text-[#2dd4bf] border border-[#2dd4bf]/40'
                        : 'bg-teal-50 text-teal-700 border border-teal-300'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File (.xlsx / .csv)</span>
                </button>

                <button
                  onClick={() => setActiveTab('paste')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'paste'
                      ? isDark
                        ? 'bg-[#121620] text-[#2dd4bf] border border-[#2dd4bf]/40'
                        : 'bg-teal-50 text-teal-700 border border-teal-300'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <Clipboard className="w-4 h-4" />
                  <span>Paste Tabular Data</span>
                </button>
              </div>

              {/* Tab 1: File Dropzone */}
              {activeTab === 'upload' && (
                <div className={`p-8 border-2 border-dashed rounded-3xl text-center space-y-4 transition-all ${isDark ? 'border-[#1e2430] bg-[#07090d] hover:border-[#2dd4bf]/50' : 'border-slate-300 bg-slate-50 hover:border-teal-500'
                  }`}>
                  <Upload className="w-10 h-10 text-[#2dd4bf] mx-auto" />
                  <div>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Click to choose or drop your Excel file (.xlsx, .xls) or CSV here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Expected columns: Project Code, Project Name, Division, Category, Status, FY, Investment (MRs), Manhours Saved
                    </p>
                  </div>

                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="bulk-file-input"
                  />
                  <label
                    htmlFor="bulk-file-input"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2dd4bf] hover:bg-[#26bba8] text-[#06080b] font-black text-xs cursor-pointer shadow-md shadow-[#2dd4bf]/20 transition-all active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Select Spreadsheet File</span>
                  </label>

                  {file && (
                    <p className="text-xs font-mono font-bold text-[#2dd4bf]">
                      Loaded: {file.name} ({parsedRows.length} rows parsed)
                    </p>
                  )}
                </div>
              )}

              {/* Tab 2: Paste Area */}
              {activeTab === 'paste' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">
                      Copy cells from Excel or Google Sheets and paste them directly into the text box below:
                    </p>

                    {pastedText.trim() && (
                      <button
                        onClick={() => {
                          setPastedText('');
                          setCustomColMap({});
                          setCustomValueOverrides({});
                          setManualHeaderToggle(false);
                        }}
                        className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        Clear Text
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={5}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={'Without Header Example:\nVU-1\tAI Chatbot\tDigital AI\tLive\tFY 24-25\t1.5\t450\n\nWith Header Example:\nProject Code\tProject Name\tDivision\tCategory\tStatus\tFY\tInvestment\tManhours\nVU-1\tAI Chatbot\tDigital AI\tLive\tFY 24-25\t1.5\t450'}
                    className={`w-full p-4 rounded-2xl text-xs font-mono focus:outline-none transition-all ${isDark
                        ? 'bg-[#07090d] border border-[#1e2430] text-white focus:border-[#2dd4bf]'
                        : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                  />

                  {/* Header Toggle & Live Column-to-Field Mapping Preview */}
                  {pastedMatrix.length > 0 && (
                    <div className={`p-4 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0a0d14] border-[#1e2430]' : 'bg-slate-50 border-slate-200'}`}>
                      {/* Controls Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1e2430]/60">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={hasHeaderRow}
                            onChange={(e) => {
                              setHasHeaderRow(e.target.checked);
                              setManualHeaderToggle(true);
                            }}
                            className="w-4 h-4 rounded text-[#2dd4bf] focus:ring-[#2dd4bf] bg-slate-800 border-slate-700 cursor-pointer"
                          />
                          <div>
                            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              First row contains column headings (Header)
                            </span>
                            <p className="text-[11px] text-slate-400">
                              {hasHeaderRow
                                ? 'Line 1 is used as column titles'
                                : 'Heading OFF: Line 1 will be imported directly as row data!'}
                            </p>
                          </div>
                        </label>

                        <div className="text-[11px] font-mono font-bold text-[#2dd4bf] bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 px-3 py-1 rounded-xl">
                          {detectedColCount} Columns Detected
                        </div>
                      </div>

                      {/* Column-to-Field Live Mapping Preview Cards */}
                      {sampleDataRow && sampleDataRow.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <span>Live Value ➔ Field Mapping Preview</span>
                            </p>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Showing sample values from Row {hasHeaderRow ? '2' : '1'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {Array.from({ length: detectedColCount }).map((_, colIdx) => {
                              const originalSampleVal = sampleDataRow[colIdx] !== undefined ? String(sampleDataRow[colIdx]) : '';
                              const currentVal = customValueOverrides[colIdx] !== undefined ? customValueOverrides[colIdx] : originalSampleVal;
                              const currentField = currentEffectiveColMap[colIdx] || 'ignore';
                              const fieldDef = FIELD_DEFINITIONS.find(f => f.key === currentField);
                              const fieldLabel = fieldDef ? fieldDef.label : (DEFAULT_COLUMN_FIELDS[colIdx] || `Column ${colIdx + 1}`);
                              const isOverridden = customValueOverrides[colIdx] !== undefined && customValueOverrides[colIdx] !== originalSampleVal;

                              return (
                                <div
                                  key={colIdx}
                                  className={`p-3 rounded-2xl border flex flex-col justify-between space-y-2.5 transition-all ${isDark ? 'bg-[#0e121a] border-[#1e2430]' : 'bg-white border-slate-200'
                                    }`}
                                >
                                  {/* Top Row: Col Index + Fixed Field Label */}
                                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                                    <span className="text-[10px] font-mono font-black text-slate-400 uppercase shrink-0">
                                      COL {colIdx + 1}
                                    </span>

                                    <span
                                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-sans truncate max-w-[170px] ${isDark
                                          ? 'bg-[#121b2b] text-[#2dd4bf] border border-[#2dd4bf]/30'
                                          : 'bg-teal-50 text-teal-800 border border-teal-200'
                                        }`}
                                      title={fieldLabel}
                                    >
                                      {fieldLabel}
                                    </span>
                                  </div>

                                  {/* Bottom Row: Editable Input Textbox for Value */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-medium">
                                      <span className="text-slate-400">Value (Editable):</span>
                                      {isOverridden && (
                                        <button
                                          onClick={() => {
                                            setCustomValueOverrides(prev => {
                                              const copy = { ...prev };
                                              delete copy[colIdx];
                                              return copy;
                                            });
                                          }}
                                          className="text-rose-400 hover:text-rose-300 font-bold text-[9px] underline"
                                        >
                                          Reset
                                        </button>
                                      )}
                                    </div>

                                    <input
                                      type="text"
                                      value={currentVal}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCustomValueOverrides(prev => ({
                                          ...prev,
                                          [colIdx]: val
                                        }));
                                      }}
                                      placeholder="empty"
                                      className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none transition-all ${isDark
                                          ? 'bg-[#07090d] border border-[#1e2430] text-amber-300 focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]/30'
                                          : 'bg-slate-50 border border-slate-200 text-amber-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30'
                                        }`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handlePasteProcess}
                    className="px-5 py-2.5 rounded-xl bg-[#2dd4bf] hover:bg-[#26bba8] text-[#06080b] font-black text-xs transition-all active:scale-95 flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-Validate Pasted Rows</span>
                  </button>
                </div>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Validation Preview ({parsedRows.length} total rows)
                    </h3>

                    {/* Status Counters */}
                    <div className="flex items-center gap-2 text-xs font-mono font-bold">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        🟢 {insertCount} Inserts
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40">
                        🔵 {updateCount} Updates
                      </span>
                      {invalidCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          🔴 {invalidCount} Invalid (Will be skipped)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scrollable Preview Grid */}
                  <div className={`rounded-2xl border overflow-hidden max-h-[300px] overflow-y-auto ${isDark ? 'border-[#1e2430] bg-[#07090d]' : 'border-slate-200 bg-white'
                    }`}>
                    <table className={`w-full text-xs text-left divide-y ${isDark ? 'divide-[#181c24]' : 'divide-slate-200'}`}>
                      <thead className={`sticky top-0 font-bold uppercase ${isDark ? 'bg-[#080a0f] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                        <tr>
                          <th className="px-3 py-3 w-12 text-center">#</th>
                          <th className="px-3 py-3">Action</th>
                          <th className="px-3 py-3">Code</th>
                          <th className="px-3 py-3">Project Name</th>
                          <th className="px-3 py-3">Division</th>
                          <th className="px-3 py-3">Category</th>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3">FY</th>
                          <th className="px-3 py-3 text-right">Invest (MRs)</th>
                          <th className="px-3 py-3 text-right">Hours/Yr</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y font-mono ${isDark ? 'divide-[#141820]' : 'divide-slate-100'}`}>
                        {parsedRows.map((r) => (
                          <tr key={r.rowNum} className={
                            r.statusType === 'INVALID'
                              ? isDark ? 'bg-rose-950/30 text-rose-300' : 'bg-rose-50 text-rose-800'
                              : isDark ? 'hover:bg-[#111620]' : 'hover:bg-slate-50'
                          }>
                            <td className="px-3 py-2.5 text-center text-slate-400 font-bold">{r.rowNum}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {r.statusType === 'INSERT' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  + INSERT
                                </span>
                              )}
                              {r.statusType === 'UPDATE' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                  ↺ UPDATE
                                </span>
                              )}
                              {r.statusType === 'INVALID' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30" title={r.reason}>
                                  ✕ INVALID ({r.reason})
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 font-bold">{r.project_code || 'Auto-gen'}</td>
                            <td className="px-3 py-2.5 font-sans font-bold">{r.projectName || '—'}</td>
                            <td className="px-3 py-2.5 font-sans">{r.division || '—'}</td>
                            <td className="px-3 py-2.5 font-sans">{r.category || '—'}</td>
                            <td className="px-3 py-2.5 font-sans">{r.status}</td>
                            <td className="px-3 py-2.5">{r.fy}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-amber-400">{r.investmentMrs.toFixed(1)}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-teal-400">{r.manhourSavings.toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer Controls */}
        {!resultSummary && (
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
              disabled={submitting || validCount === 0}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-[#2dd4bf] hover:bg-[#26bba8] text-[#06080b] font-black text-xs shadow-lg shadow-[#2dd4bf]/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-[#06080b] rounded-full animate-spin"></div>
                  <span>Processing SQLite Transaction...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Save ({validCount} valid records)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};

export default BulkImportModal;
