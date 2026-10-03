import React, { useState, useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const getCurrentFY = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const startYr = currentMonth >= 4 ? currentYear : currentYear - 1;
  const y1 = String(startYr).slice(-2);
  const y2 = String(startYr + 1).slice(-2);
  return `FY ${y1}-${y2}`;
};

const getDynamicFinancialYears = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const baseCurrentStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
  const maxEndTargetYear = Math.max(baseCurrentStartYear + 4, 2030);

  const generated = [];
  for (let yr = 2022; yr <= maxEndTargetYear; yr++) {
    const startYearStr = String(yr).slice(-2);
    const endYearStr = String(yr + 1).slice(-2);
    generated.push(`FY ${startYearStr}-${endYearStr}`);
  }
  return generated;
};

const InteractiveLineGraph = ({ yearlyData = [] }) => {
  const { isDark } = useTheme();
  const [hoveredYear, setHoveredYear] = useState(null);
  const [activeLines, setActiveLines] = useState({
    totalSavings: true,
    directSavings: true,
    indirectSavings: true,
    hoursSaved: false
  });

  const currentFY = useMemo(() => getCurrentFY(), []);
  const dynamicYears = useMemo(() => getDynamicFinancialYears(), []);

  // Filter years to show up to current year + 2 years ahead for clean graph readability
  const displayYears = useMemo(() => {
    const currentIdx = dynamicYears.indexOf(currentFY);
    const maxIdx = currentIdx !== -1 ? Math.min(dynamicYears.length, currentIdx + 3) : 6;
    return dynamicYears.slice(0, maxIdx);
  }, [dynamicYears, currentFY]);

  // Default structure if empty
  const data = displayYears.map(fy => {
    const found = yearlyData.find(d => d.fy === fy) || {};
    return {
      fy,
      isCurrent: fy === currentFY,
      totalSavings: Number(found.totalSavings) || 0,
      directSavings: Number(found.directSavings) || 0,
      indirectSavings: Number(found.indirectSavings) || 0,
      hoursSaved: Number(found.hoursSaved) || 0,
      count: found.count || 0
    };
  });

  // Calculate max values for dynamic Y-axis scaling
  const maxSavings = Math.max(...data.map(d => Math.max(d.totalSavings, d.directSavings, d.indirectSavings)), 100);
  const maxHours = Math.max(...data.map(d => d.hoursSaved), 500);

  // SVG Dimension Constants
  const width = 640;
  const height = 280;
  const padding = { top: 30, right: 35, bottom: 40, left: 55 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Scale Functions
  const getX = (index) => padding.left + (index / (data.length - 1 || 1)) * graphWidth;
  const getY = (val, max) => padding.top + graphHeight - ((val || 0) / (max || 1)) * graphHeight;

  // Generate SVG Path String
  const generatePath = (dataKey, maxVal) => {
    if (data.length === 0) return '';
    return data.reduce((acc, curr, idx) => {
      const x = getX(idx);
      const y = getY(curr[dataKey], maxVal);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  // Generate smooth curved area fill path
  const generateAreaPath = (dataKey, maxVal) => {
    if (data.length === 0) return '';
    const linePath = generatePath(dataKey, maxVal);
    const lastX = getX(data.length - 1);
    const firstX = getX(0);
    const bottomY = padding.top + graphHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const hoveredData = hoveredYear ? data.find(d => d.fy === hoveredYear) : null;

  return (
    <div className="space-y-4">
      
      {/* Legend & Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Total Cost Savings Line Toggle */}
          <button
            onClick={() => setActiveLines(prev => ({ ...prev, totalSavings: !prev.totalSavings }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all ${
              activeLines.totalSavings 
                ? 'bg-[#0f241e] border-[#2dd4bf] text-[#2dd4bf] shadow-xs' 
                : 'bg-[#07090d] border-[#1e2430] text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf]"></span>
            <span>Total Savings (90%)</span>
          </button>

          {/* Direct Savings Line Toggle */}
          <button
            onClick={() => setActiveLines(prev => ({ ...prev, directSavings: !prev.directSavings }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all ${
              activeLines.directSavings 
                ? 'bg-[#101b2a] border-sky-400 text-sky-400 shadow-xs' 
                : 'bg-[#07090d] border-[#1e2430] text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <span>Direct (65%)</span>
          </button>

          {/* Indirect Savings Line Toggle */}
          <button
            onClick={() => setActiveLines(prev => ({ ...prev, indirectSavings: !prev.indirectSavings }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all ${
              activeLines.indirectSavings 
                ? 'bg-[#211b11] border-amber-400 text-amber-400 shadow-xs' 
                : 'bg-[#07090d] border-[#1e2430] text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Indirect (25%)</span>
          </button>

          {/* Hours Saved Line Toggle */}
          <button
            onClick={() => setActiveLines(prev => ({ ...prev, hoursSaved: !prev.hoursSaved }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all ${
              activeLines.hoursSaved 
                ? 'bg-[#231226] border-purple-400 text-purple-400 shadow-xs' 
                : 'bg-[#07090d] border-[#1e2430] text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <span>Hours Saved (Hrs)</span>
          </button>

        </div>

        <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
          Interactive Trajectory Model
        </span>
      </div>

      {/* SVG Interactive Multi-Line Graph */}
      <div className="relative bg-[#07090d] border border-[#1e2430] rounded-2xl p-2 sm:p-4 overflow-hidden shadow-inner">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Soft Gradient Under Total Savings Area */}
            <linearGradient id="totalSavingsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
            </linearGradient>

            {/* Direct Savings Area */}
            <linearGradient id="directSavingsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>

            {/* Drop Shadow for points */}
            <filter id="glowPoint" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#2dd4bf" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Grid Lines (Horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + graphHeight * (1 - ratio);
            const val = (maxSavings * ratio).toFixed(0);
            return (
              <g key={ratio} className="text-slate-700">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  opacity="0.3"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono font-medium"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Shaded Area Fills */}
          {activeLines.totalSavings && (
            <path
              d={generateAreaPath('totalSavings', maxSavings)}
              fill="url(#totalSavingsGrad)"
              className="transition-all duration-300"
            />
          )}

          {activeLines.directSavings && (
            <path
              d={generateAreaPath('directSavings', maxSavings)}
              fill="url(#directSavingsGrad)"
              className="transition-all duration-300"
            />
          )}

          {/* Vertical Guides for Hover */}
          {data.map((d, idx) => {
            const x = getX(idx);
            const isHovered = hoveredYear === d.fy;
            return (
              <line
                key={d.fy}
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + graphHeight}
                stroke={isHovered ? '#2dd4bf' : '#1e2430'}
                strokeWidth={isHovered ? '2' : '1'}
                strokeDasharray={isHovered ? 'none' : '3 3'}
                className="transition-colors duration-150"
              />
            );
          })}

          {/* Savings Lines */}
          {activeLines.directSavings && (
            <path
              d={generatePath('directSavings', maxSavings)}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300 drop-shadow-sm"
            />
          )}

          {activeLines.indirectSavings && (
            <path
              d={generatePath('indirectSavings', maxSavings)}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="5 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {activeLines.hoursSaved && (
            <path
              d={generatePath('hoursSaved', maxHours)}
              fill="none"
              stroke="#c084fc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Main Hero Line: Total Savings */}
          {activeLines.totalSavings && (
            <path
              d={generatePath('totalSavings', maxSavings)}
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Data Points on Nodes */}
          {data.map((d, idx) => {
            const x = getX(idx);
            const isHovered = hoveredYear === d.fy;

            return (
              <g 
                key={d.fy} 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredYear(d.fy)}
                onMouseLeave={() => setHoveredYear(null)}
              >
                {/* Total Savings Point */}
                {activeLines.totalSavings && (
                  <circle
                    cx={x}
                    cy={getY(d.totalSavings, maxSavings)}
                    r={isHovered ? 7 : 4.5}
                    fill="#06080b"
                    stroke="#2dd4bf"
                    strokeWidth="3"
                    className="transition-all duration-200"
                    filter={isHovered ? 'url(#glowPoint)' : undefined}
                  />
                )}

                {/* Direct Savings Point */}
                {activeLines.directSavings && (
                  <circle
                    cx={x}
                    cy={getY(d.directSavings, maxSavings)}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#06080b"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />
                )}

                {/* X-Axis Tick Labels with Auto (Current) tag */}
                <text
                  x={x}
                  y={padding.top + graphHeight + 20}
                  textAnchor="middle"
                  className={`text-xs font-mono font-bold transition-colors ${
                    isHovered 
                      ? 'fill-[#2dd4bf] font-black' 
                      : d.isCurrent
                      ? 'fill-[#2dd4bf]'
                      : 'fill-slate-400'
                  }`}
                >
                  {d.fy}
                </text>
                {d.isCurrent && (
                  <text
                    x={x}
                    y={padding.top + graphHeight + 32}
                    textAnchor="middle"
                    className="text-[9px] font-black fill-[#2dd4bf] uppercase tracking-wider"
                  >
                    Current
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredData && (
          <div 
            className="absolute top-4 right-4 bg-[#0d1017]/95 border border-[#2dd4bf]/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-1.5 animate-slide-down pointer-events-none z-20 min-w-[200px]"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#181c24]">
              <span className="font-mono font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#2dd4bf]" />
                <span>{hoveredData.fy}</span>
                {hoveredData.isCurrent && (
                  <span className="text-[10px] bg-[#0f241e] text-[#2dd4bf] px-1.5 py-0.2 rounded border border-[#2dd4bf]/30">
                    Current
                  </span>
                )}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">{hoveredData.count} Projects</span>
            </div>

            <div className="space-y-1 pt-0.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2dd4bf]"></span>
                  <span>Total Savings:</span>
                </span>
                <span className="font-mono font-black text-[#2dd4bf]">
                  {hoveredData.totalSavings.toFixed(1)} MRs
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span>Direct (65%):</span>
                </span>
                <span className="font-mono font-bold text-sky-400">
                  {hoveredData.directSavings.toFixed(1)} MRs
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Indirect (25%):</span>
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {hoveredData.indirectSavings.toFixed(1)} MRs
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-[#181c24]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>Manhours:</span>
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {hoveredData.hoursSaved.toFixed(0)} Hrs
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Year-by-Year Financial Value & Growth Milestone Cards Grid */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Year-by-Year Trajectory Breakdown
          </span>
          <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-[#2dd4bf]' : 'text-teal-700'}`}>
            {data.length} Financial Periods
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5">
          {data.map((d) => {
            const isHovered = hoveredYear === d.fy;
            return (
              <div
                key={d.fy}
                onMouseEnter={() => setHoveredYear(d.fy)}
                onMouseLeave={() => setHoveredYear(null)}
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
                  isHovered
                    ? isDark 
                      ? 'bg-[#0f241e] border-[#2dd4bf] shadow-lg shadow-[#2dd4bf]/20 scale-[1.02]'
                      : 'bg-teal-50 border-teal-500 shadow-md scale-[1.02]'
                    : d.isCurrent
                      ? isDark 
                        ? 'bg-[#0a1824] border-sky-500/50'
                        : 'bg-sky-50 border-sky-300'
                      : isDark
                        ? 'bg-[#07090d] border-[#1e2430] hover:border-slate-600'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Header: FY + Now Badge */}
                <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                  <span className={`font-mono text-[11px] sm:text-xs font-black whitespace-nowrap truncate min-w-0 ${
                    d.isCurrent 
                      ? (isDark ? 'text-sky-400' : 'text-sky-700') 
                      : isHovered 
                        ? (isDark ? 'text-[#2dd4bf]' : 'text-teal-700') 
                        : (isDark ? 'text-slate-200' : 'text-slate-900')
                  }`}>
                    {d.fy}
                  </span>
                  {d.isCurrent && (
                    <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded leading-none shrink-0 bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      Now
                    </span>
                  )}
                </div>

                {/* Total Savings MRs */}
                <div className="flex items-baseline justify-between gap-1 my-1 min-w-0 overflow-hidden">
                  <span className={`font-mono text-xs sm:text-sm font-black tracking-tight truncate ${isDark ? 'text-[#2dd4bf]' : 'text-teal-700'}`}>
                    {d.totalSavings.toFixed(1)}
                  </span>
                  <span className={`text-[10px] font-bold shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>MRs</span>
                </div>

                {/* Direct, Indirect, Hours Rows */}
                <div className={`pt-1.5 mt-1 border-t space-y-1 text-[10px] sm:text-[11px] min-w-0 ${
                  isDark ? 'border-[#181c24]' : 'border-slate-200'
                }`}>
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span className={`font-semibold shrink-0 text-[10px] sm:text-[11px] ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>Direct</span>
                    <span className={`font-mono font-bold truncate text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{d.directSavings.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span className={`font-semibold shrink-0 text-[10px] sm:text-[11px] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Indirect</span>
                    <span className={`font-mono font-bold truncate text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{d.indirectSavings.toFixed(1)}</span>
                  </div>
                  <div className={`flex items-center justify-between gap-1 pt-1 border-t min-w-0 ${
                    isDark ? 'border-[#181c24]/60' : 'border-slate-200'
                  }`}>
                    <span className={`font-semibold shrink-0 text-[10px] sm:text-[11px] ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Hours</span>
                    <span className={`font-mono font-bold truncate text-right ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{d.hoursSaved.toFixed(0)}h</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default InteractiveLineGraph;
