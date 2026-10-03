import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, PlayCircle, Layers, 
  DollarSign, Sparkles 
} from 'lucide-react';

const StatusPieChart = ({ projects = [], statusCounts = {} }) => {
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [metricMode, setMetricMode] = useState('savings'); // 'savings' | 'count'

  // Calculate live totals from filtered projects list
  let totalSavingsLive = 0;
  let totalSavingsTbs = 0;
  let totalSavingsEngaged = 0;
  let totalSavingsOthers = 0;

  let liveCount = 0;
  let tbsCount = 0;
  let engagedCount = 0;
  let othersCount = 0;

  projects.forEach((p) => {
    const savings = Number(p.total_cost_saving_mrs) || 0;
    const st = p.status || '';

    if (st === 'Live') {
      totalSavingsLive += savings;
      liveCount++;
    } else if (st === 'TBS to be started') {
      totalSavingsTbs += savings;
      tbsCount++;
    } else if (st === 'Engaged') {
      totalSavingsEngaged += savings;
      engagedCount++;
    } else {
      totalSavingsOthers += savings;
      othersCount++;
    }
  });

  const totalSavings = totalSavingsLive + totalSavingsTbs + totalSavingsEngaged + totalSavingsOthers;
  const totalCount = projects.length;

  const live = statusCounts.live !== undefined ? statusCounts.live : liveCount;
  const tbs = statusCounts.tbs !== undefined ? statusCounts.tbs : tbsCount;
  const engaged = statusCounts.engaged !== undefined ? statusCounts.engaged : engagedCount;
  const others = totalCount - (live + tbs + engaged);

  // Status slice definitions with Power BI standard color palette
  const rawSlices = [
    {
      id: 'Live',
      label: 'Live (Completed)',
      shortLabel: 'Live',
      count: live,
      savings: totalSavingsLive,
      color: '#2dd4bf', // Electric Mint
      gradientFrom: '#5eead4',
      gradientTo: '#0d9488',
      bgColor: 'bg-[#0f241e]',
      textColor: 'text-[#2dd4bf]',
      borderColor: 'border-[#2dd4bf]/50',
      icon: CheckCircle2,
      desc: 'Deployed in Production'
    },
    {
      id: 'TBS to be started',
      label: 'TBS (Pending / Backlog)',
      shortLabel: 'Pending',
      count: tbs,
      savings: totalSavingsTbs,
      color: '#fbbf24', // Amber
      gradientFrom: '#fde68a',
      gradientTo: '#d97706',
      bgColor: 'bg-[#24170a]',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-500/50',
      icon: Clock,
      desc: 'Queued for Execution'
    },
    {
      id: 'Engaged',
      label: 'Engaged (In Progress)',
      shortLabel: 'Engaged',
      count: engaged,
      savings: totalSavingsEngaged,
      color: '#38bdf8', // Sky Blue
      gradientFrom: '#7dd3fc',
      gradientTo: '#0284c7',
      bgColor: 'bg-[#0a1824]',
      textColor: 'text-sky-300',
      borderColor: 'border-sky-500/50',
      icon: PlayCircle,
      desc: 'Active Development'
    },
    ...(others > 0 ? [{
      id: 'Other',
      label: 'Other Statuses',
      shortLabel: 'Other',
      count: others,
      savings: totalSavingsOthers,
      color: '#a78bfa', // Purple
      gradientFrom: '#c4b5fd',
      gradientTo: '#7c3aed',
      bgColor: 'bg-[#180f26]',
      textColor: 'text-purple-300',
      borderColor: 'border-purple-500/50',
      icon: AlertCircle,
      desc: 'Review / On Hold'
    }] : [])
  ];

  const slices = rawSlices.filter(s => (metricMode === 'count' ? s.count > 0 : s.savings > 0) || totalCount === 0);

  // Enlarged SVG Geometry Dimensions
  const svgWidth = 620;
  const svgHeight = 360;
  const cx = 310;
  const cy = 180;
  const outerRadius = 104;
  const innerRadius = 66;
  const lineStartRadius = 110;
  const lineElbowRadius = 142;

  const totalVal = metricMode === 'count' ? totalCount : totalSavings;

  if (totalCount === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500 text-xs">
        No project data available for selected slicers
      </div>
    );
  }

  // Calculate arc paths, angles, and leader line coordinates for each slice
  let currentAngle = 0;
  const gapAngle = slices.length > 1 ? 2.5 : 0; // Degrees gap between slices

  const sliceData = slices.map((slice) => {
    const val = metricMode === 'count' ? slice.count : slice.savings;
    const fraction = totalVal > 0 ? val / totalVal : 0;
    const sweepAngle = Math.max(0, fraction * 360 - gapAngle);

    const startAngle = currentAngle + gapAngle / 2;
    const endAngle = startAngle + sweepAngle;
    const midAngle = (startAngle + endAngle) / 2;
    currentAngle += fraction * 360;

    // Convert polar angle to Cartesian (x, y) coordinates
    const polarToCartesian = (radius, angleInDegrees) => {
      const radians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: cx + radius * Math.cos(radians),
        y: cy + radius * Math.sin(radians)
      };
    };

    // SVG donut slice arc path
    const startOuter = polarToCartesian(outerRadius, startAngle);
    const endOuter = polarToCartesian(outerRadius, endAngle);
    const startInner = polarToCartesian(innerRadius, startAngle);
    const endInner = polarToCartesian(innerRadius, endAngle);
    const largeArcFlag = sweepAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
      'Z'
    ].join(' ');

    // Leader Callout Line Coordinates
    const lineStart = polarToCartesian(lineStartRadius, midAngle);
    const lineElbow = polarToCartesian(lineElbowRadius, midAngle);
    const isRightSide = lineElbow.x >= cx;
    const lineEnd = {
      x: isRightSide ? lineElbow.x + 32 : lineElbow.x - 32,
      y: lineElbow.y
    };

    // Pop-out Vector on Hover
    const midRad = ((midAngle - 90) * Math.PI) / 180.0;
    const hoverTranslateX = Math.cos(midRad) * 8;
    const hoverTranslateY = Math.sin(midRad) * 8;

    const pct = ((fraction) * 100).toFixed(1);
    const displayValue = metricMode === 'count' ? `${slice.count} Projects` : `${slice.savings.toFixed(1)} MRs`;

    return {
      ...slice,
      fraction,
      pct,
      displayValue,
      pathData,
      midAngle,
      lineStart,
      lineElbow,
      lineEnd,
      isRightSide,
      hoverTranslateX,
      hoverTranslateY
    };
  });

  const activeHoveredSlice = sliceData.find(s => s.id === hoveredStatus);

  return (
    <div className="space-y-4 select-none">
      
      {/* Top Header Controls: Highlighted Prominent Metric Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">View Metric:</span>
          <div className="flex p-1 bg-[#07090d] rounded-2xl border border-[#1e2430] shadow-md">
            <button
              onClick={() => setMetricMode('savings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                metricMode === 'savings'
                  ? 'bg-[#2dd4bf] text-[#06080b] shadow-md shadow-[#2dd4bf]/30 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-[#121620]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Total Cost Savings ({totalSavings.toFixed(1)} MRs)</span>
            </button>
            <button
              onClick={() => setMetricMode('count')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                metricMode === 'count'
                  ? 'bg-[#2dd4bf] text-[#06080b] shadow-md shadow-[#2dd4bf]/30 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-[#121620]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Project Count ({totalCount} Projects)</span>
            </button>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#2dd4bf]" />
          <span>Hover slice to highlight breakdown</span>
        </span>
      </div>

      {/* SVG Container for Power BI Donut Canvas with Leader Callout Lines */}
      <div className="relative bg-[#07090d] border border-[#1e2430] rounded-2xl flex items-center justify-center p-3 sm:p-5 overflow-hidden shadow-inner min-h-[360px]">
        
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[620px] h-auto overflow-visible select-none"
        >
          <defs>
            {/* Smooth Radial & Linear Gradients for Slices */}
            {sliceData.map((slice) => (
              <linearGradient
                key={slice.id}
                id={`sliceGrad-${slice.id.replace(/\s+/g, '')}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={slice.gradientFrom} />
                <stop offset="100%" stopColor={slice.gradientTo} />
              </linearGradient>
            ))}

            {/* Center Hub Radiant Gradient */}
            <radialGradient id="centerHubGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#141c28" />
              <stop offset="85%" stopColor="#0d1118" />
              <stop offset="100%" stopColor="#07090d" />
            </radialGradient>

            {/* Neon Glow Filter */}
            <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Central Donut Hole Backing with Glowing Border */}
          <circle
            cx={cx}
            cy={cy}
            r={innerRadius - 4}
            fill="url(#centerHubGrad)"
            stroke={hoveredStatus ? '#2dd4bf' : '#2dd4bf'}
            strokeWidth="1.8"
            strokeOpacity={hoveredStatus ? '0.8' : '0.4'}
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }}
            className="transition-all duration-300"
          />

          {/* Donut Arc Slices */}
          <g className="transition-all duration-500">
            {sliceData.map((slice) => {
              const isHovered = hoveredStatus === slice.id;

              return (
                <path
                  key={slice.id}
                  d={slice.pathData}
                  fill={`url(#sliceGrad-${slice.id.replace(/\s+/g, '')})`}
                  className="cursor-pointer transition-all duration-300"
                  style={{
                    transform: isHovered
                      ? `translate(${slice.hoverTranslateX}px, ${slice.hoverTranslateY}px) scale(1.04)`
                      : 'translate(0px, 0px) scale(1)',
                    transformOrigin: `${cx}px ${cy}px`,
                    filter: isHovered ? 'url(#neonGlow)' : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
                    opacity: hoveredStatus && !isHovered ? 0.35 : 1
                  }}
                  onMouseEnter={() => setHoveredStatus(slice.id)}
                  onMouseLeave={() => setHoveredStatus(null)}
                />
              );
            })}
          </g>

          {/* Power BI Leader Callout Lines & Exact Highlighted Labels */}
          {sliceData.map((slice) => {
            const isHovered = hoveredStatus === slice.id;
            const lineColor = isHovered ? slice.color : '#3d4d63';
            const textColor = isHovered ? slice.color : '#e2e8f0';
            const pctColor = isHovered ? '#ffffff' : '#94a3b8';

            // SVG polyline path for bent elbow line: Start -> Elbow -> Horizontal Extension
            const pointsString = `${slice.lineStart.x},${slice.lineStart.y} ${slice.lineElbow.x},${slice.lineElbow.y} ${slice.lineEnd.x},${slice.lineEnd.y}`;

            const textX = slice.isRightSide ? slice.lineEnd.x + 8 : slice.lineEnd.x - 8;
            const textAnchor = slice.isRightSide ? 'start' : 'end';

            return (
              <g
                key={`callout-${slice.id}`}
                className="cursor-pointer transition-all duration-300 select-none"
                onMouseEnter={() => setHoveredStatus(slice.id)}
                onMouseLeave={() => setHoveredStatus(null)}
                style={{ opacity: hoveredStatus && !isHovered ? 0.25 : 1 }}
              >
                {/* 2-Segment Leader Elbow Line */}
                <polyline
                  points={pointsString}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={isHovered ? 2.2 : 1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors duration-300"
                />

                {/* Outer Connection Point Dot */}
                <circle
                  cx={slice.lineStart.x}
                  cy={slice.lineStart.y}
                  r={isHovered ? 3.5 : 2}
                  fill={lineColor}
                  className="transition-all duration-300"
                />

                {/* Callout Label Line 1: Big Bold Value + Explicit Unit */}
                <text
                  x={textX}
                  y={slice.lineEnd.y - 5}
                  textAnchor={textAnchor}
                  fill={textColor}
                  className="text-[12px] font-black font-mono tracking-tight transition-colors duration-300"
                >
                  {slice.displayValue}
                </text>

                {/* Callout Label Line 2: Status Name + Percentage % in Brackets */}
                <text
                  x={textX}
                  y={slice.lineEnd.y + 11}
                  textAnchor={textAnchor}
                  fill={pctColor}
                  className="text-[11px] font-mono font-bold transition-colors duration-300"
                >
                  {slice.shortLabel} ({slice.pct}%)
                </text>
              </g>
            );
          })}

          {/* Highlighted Center Donut Hub Content with Explicit Units */}
          <g className="pointer-events-none text-center">
            
            {/* Top Hub Title */}
            <text
              x={cx}
              y={cy - 18}
              textAnchor="middle"
              fill="#cbd5e1"
              className="text-[10px] font-extrabold uppercase tracking-widest"
            >
              {activeHoveredSlice 
                ? activeHoveredSlice.shortLabel
                : (metricMode === 'savings' ? 'TOTAL SAVINGS' : 'TOTAL SCOPE')}
            </text>

            {/* Big Punchy Number with Drop Shadow */}
            <text
              x={cx}
              y={cy + 8}
              textAnchor="middle"
              fill="#ffffff"
              className="text-[23px] font-black font-mono tracking-tight"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))' }}
            >
              {activeHoveredSlice 
                ? (metricMode === 'savings' ? `${activeHoveredSlice.savings.toFixed(1)}` : `${activeHoveredSlice.count}`)
                : (metricMode === 'savings' ? `${totalSavings.toFixed(1)}` : `${totalCount}`)}
            </text>

            {/* Bottom Highlighted Subtitle with Explicit Units */}
            <text
              x={cx}
              y={cy + 26}
              textAnchor="middle"
              fill="#2dd4bf"
              className="text-[11px] font-mono font-extrabold"
              style={{ filter: 'drop-shadow(0 0 6px rgba(45,212,191,0.5))' }}
            >
              {activeHoveredSlice 
                ? (metricMode === 'savings' ? `MRs (${activeHoveredSlice.pct}%)` : `Projects (${activeHoveredSlice.pct}%)`)
                : (metricMode === 'savings' ? `MRs (${totalCount} Projects)` : `${totalCount} Projects Total`)}
            </text>
          </g>
        </svg>

      </div>

      {/* Slices Summary Strip with Explicit Units */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {sliceData.map((slice) => {
          const isHovered = hoveredStatus === slice.id;

          return (
            <div
              key={slice.id}
              className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                isHovered
                  ? `${slice.bgColor} ${slice.borderColor} shadow-xl scale-[1.02]`
                  : 'bg-[#07090d] border-[#1e2430] hover:bg-[#121620]'
              }`}
              onMouseEnter={() => setHoveredStatus(slice.id)}
              onMouseLeave={() => setHoveredStatus(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: slice.color }}
                  ></div>
                  <span className="text-xs font-bold text-white truncate">{slice.shortLabel}</span>
                </div>
                <span className="text-xs font-mono font-black text-[#2dd4bf]">{slice.pct}%</span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono mt-2 pt-2 border-t border-[#181c24]">
                <span className="text-slate-400 font-medium">{slice.count} Projects</span>
                <span className="text-white font-black">{slice.savings.toFixed(1)} MRs</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default StatusPieChart;
