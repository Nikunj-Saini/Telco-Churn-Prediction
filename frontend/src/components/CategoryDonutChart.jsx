import React, { useState } from 'react';

const CategoryDonutChart = ({ categoryMap = {} }) => {
  const [hoveredCat, setHoveredCat] = useState(null);

  const colors = [
    { from: '#2dd4bf', to: '#14b8a6', text: 'text-[#2dd4bf]', bg: 'bg-[#0f241e]', border: 'border-[#2dd4bf]/40' },
    { from: '#38bdf8', to: '#0284c7', text: 'text-sky-300', bg: 'bg-[#0a1824]', border: 'border-sky-500/40' },
    { from: '#a78bfa', to: '#7c3aed', text: 'text-purple-300', bg: 'bg-[#180f26]', border: 'border-purple-500/40' },
    { from: '#fbbf24', to: '#d97706', text: 'text-amber-300', bg: 'bg-[#24170a]', border: 'border-amber-500/40' },
  ];

  const entries = Object.entries(categoryMap);
  const totalSavings = entries.reduce((acc, [_, d]) => acc + (d.savings || 0), 0);

  if (entries.length === 0 || totalSavings === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
        No category data available
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      {/* Category Progress Bars & Distribution */}
      <div className="space-y-3">
        {entries.map(([cat, data], idx) => {
          const color = colors[idx % colors.length];
          const pct = totalSavings > 0 ? ((data.savings / totalSavings) * 100).toFixed(1) : 0;
          const isHovered = hoveredCat === cat;

          return (
            <div
              key={cat}
              className={`p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border ${
                isHovered ? `${color.bg} ${color.border} shadow-lg scale-[1.01]` : 'bg-[#07090d] border-[#1e2430] hover:bg-[#121620]'
              }`}
              onMouseEnter={() => setHoveredCat(cat)}
              onMouseLeave={() => setHoveredCat(null)}
            >
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-white">{cat}</span>
                <span className="font-mono text-[#2dd4bf] font-bold">
                  {data.savings.toFixed(1)} MRs <span className="text-slate-400 font-normal">({pct}%)</span>
                </span>
              </div>

              {/* Progress Line */}
              <div className="w-full h-2 bg-[#141820] rounded-full overflow-hidden flex">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(to right, ${color.from}, ${color.to})`
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                <span>{data.count} Projects</span>
                <span className={`${color.text} font-bold`}>{pct}% of Total</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryDonutChart;
