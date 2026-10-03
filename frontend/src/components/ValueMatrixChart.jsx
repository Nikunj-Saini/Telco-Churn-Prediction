import React, { useMemo } from 'react';
import { Target, Zap, Cpu, Users } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ValueMatrixChart = ({ projects = [] }) => {
  const { isDark } = useTheme();

  // Compute In-House vs QD, Parent vs Child, and Value Matrix quadrants
  const metrics = useMemo(() => {
    let divCount = 0;
    let qdCount = 0;
    let divSavings = 0;
    let qdSavings = 0;

    let parentCount = 0;
    let childCount = 0;

    let quickWins = 0;       // Low Investment (<= 10 MRs), High Savings (>= 50 MRs)
    let strategicPillars = 0; // High Investment (> 10 MRs), High Savings (>= 50 MRs)
    let standardProjects = 0; // Other

    projects.forEach(p => {
      const inv = Number(p.investment_mrs) || 0;
      const sav = Number(p.total_cost_saving_mrs) || 0;

      // Inhouse vs QD
      if ((p.inhouse || '').toUpperCase() === 'QD') {
        qdCount++;
        qdSavings += sav;
      } else {
        divCount++;
        divSavings += sav;
      }

      // Parent vs Child
      if ((p.project_type_parent_child || '').toLowerCase() === 'child') {
        childCount++;
      } else {
        parentCount++;
      }

      // Value Matrix Quadrant
      if (inv <= 10 && sav >= 50) {
        quickWins++;
      } else if (inv > 10 && sav >= 50) {
        strategicPillars++;
      } else {
        standardProjects++;
      }
    });

    const totalProjects = Math.max(projects.length, 1);
    const totalSavings = Math.max(divSavings + qdSavings, 1);

    return {
      divCount,
      qdCount,
      divSavings,
      qdSavings,
      divSavingsPercent: (divSavings / totalSavings) * 100,
      qdSavingsPercent: (qdSavings / totalSavings) * 100,
      divCountPercent: (divCount / totalProjects) * 100,
      qdCountPercent: (qdCount / totalProjects) * 100,
      parentCount,
      childCount,
      quickWins,
      strategicPillars,
      standardProjects
    };
  }, [projects]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#181c24] dark:border-[#181c24]">
        <div className="flex items-center gap-2">
          <Target className={`w-5 h-5 ${isDark ? 'text-[#2dd4bf]' : 'text-teal-600'}`} />
          <div>
            <h4 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Execution Matrix & Value Drivers
            </h4>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Deployment channel split and capital efficiency matrix
            </p>
          </div>
        </div>
      </div>

      {/* 1. Mode Distribution (In-House DIV vs QD) */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isDark ? 'bg-[#07090d] border-[#181c24]' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Delivery Mode: DIV vs. QD
          </span>
          <span className={`text-xs font-mono font-bold ${isDark ? 'text-[#2dd4bf]' : 'text-teal-700'}`}>
            {projects.length} Total Initiatives
          </span>
        </div>

        {/* Stacked Delivery Mode Bar */}
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-[#121620]">
          <div 
            style={{ width: `${metrics.divCountPercent}%` }}
            className="h-full bg-[#2dd4bf] transition-all duration-500"
            title={`DIV: ${metrics.divCount} Projects (${metrics.divSavings.toFixed(1)} MRs)`}
          />
          <div 
            style={{ width: `${metrics.qdCountPercent}%` }}
            className="h-full bg-sky-500 transition-all duration-500"
            title={`QD: ${metrics.qdCount} Projects (${metrics.qdSavings.toFixed(1)} MRs)`}
          />
        </div>

        {/* Delivery Mode Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-[#0d1017] border-[#1e2430]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf]"></span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>DIV (In-House)</span>
            </div>
            <p className="font-mono text-[11px] text-slate-400">
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>{metrics.divCount}</strong> Projects • <strong className={isDark ? 'text-[#2dd4bf]' : 'text-teal-700'}>{metrics.divSavings.toFixed(1)} MRs</strong>
            </p>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-[#0d1017] border-[#1e2430]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>QD (Central)</span>
            </div>
            <p className="font-mono text-[11px] text-slate-400">
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>{metrics.qdCount}</strong> Projects • <strong className="text-sky-400">{metrics.qdSavings.toFixed(1)} MRs</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Value Quadrants (Quick Wins vs Strategic) */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`p-3 rounded-2xl border text-center ${
          isDark ? 'bg-[#0f241e] border-[#2dd4bf]/40' : 'bg-teal-50 border-teal-200'
        }`}>
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#2dd4bf] dark:text-[#2dd4bf]">
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Wins</span>
          </div>
          <p className={`text-xl font-mono font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {metrics.quickWins}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">High ROI / Low CapEx</p>
        </div>

        <div className={`p-3 rounded-2xl border text-center ${
          isDark ? 'bg-[#0a1824] border-sky-500/40' : 'bg-sky-50 border-sky-200'
        }`}>
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-sky-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>Strategic</span>
          </div>
          <p className={`text-xl font-mono font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {metrics.strategicPillars}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Scale Investments</p>
        </div>

        <div className={`p-3 rounded-2xl border text-center ${
          isDark ? 'bg-[#07090d] border-[#1e2430]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>Core Base</span>
          </div>
          <p className={`text-xl font-mono font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {metrics.standardProjects}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Continuous Imprv.</p>
        </div>
      </div>
    </div>
  );
};

export default ValueMatrixChart;
