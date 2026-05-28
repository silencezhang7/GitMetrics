import React, { useState, useMemo } from 'react';
import { 
  GitCommit, 
  Code, 
  Layers, 
  Columns, 
  TrendingUp, 
  Plus, 
  X, 
  Check, 
  GitBranch,
  ArrowUpRight,
  RefreshCw,
  Eye,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ProjectTrend = {
  id: number;
  name: string;
  shortName: string;
  monthly: number[];
  weekly: number[];
  daily: number[];
  monthlyLoc?: { additions: number[]; deletions: number[] };
  dailyLoc?: { additions: number[]; deletions: number[] };
  yearlyLoc?: { years: string[]; commits: number[]; additions: number[]; deletions: number[] };
};

interface MultiProjectComparerProps {
  projects: ProjectTrend[];
  topProjects?: Array<{
    id: number;
    name: string;
    commits30d: number | null;
  }>;
  monthLabels?: string[];
}

const PALETTE = [
  { stroke: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)', text: 'text-[#38bdf8]', border: 'border-[#0ea5e9]/30' }, // Sky Blue
  { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', text: 'text-[#34d399]', border: 'border-[#10b981]/30' }, // Emerald
  { stroke: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', text: 'text-[#c084fc]', border: 'border-[#a855f7]/30' }, // Purple
  { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', text: 'text-[#fbbf24]', border: 'border-[#f59e0b]/30' },  // Amber
  { stroke: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', text: 'text-[#f472b6]', border: 'border-[#f43f5e]/30' }   // Rose
];

export const MultiProjectComparer: React.FC<MultiProjectComparerProps> = ({ 
  projects = [], 
  topProjects = [],
  monthLabels = []
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    // Default select first 2 projects if available
    return projects.slice(0, 2).map(p => p.id);
  });
  const [granularity, setGranularity] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [viewMode, setViewMode] = useState<'overlay' | 'stack'>('overlay');
  const [projectSearch, setProjectSearch] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Toggle project selection
  const toggleProject = (id: number) => {
    setSelectedIds(current => {
      if (current.includes(id)) {
        if (current.length <= 1) return current; // Keep at least one selected
        return current.filter(x => x !== id);
      } else {
        if (current.length >= 5) return current; // Limit to 5 projects to prevent visual clutter
        return [...current, id];
      }
    });
  };

  const clearSelection = () => {
    if (projects.length > 0) {
      setSelectedIds([projects[0].id]);
    }
  };

  // Map selected projects
  const selectedProjects = useMemo(() => {
    return projects
      .filter(p => selectedIds.includes(p.id))
      .map((p, idx) => ({
        ...p,
        color: PALETTE[idx % PALETTE.length]
      }));
  }, [projects, selectedIds]);

  // Find 30d commits for comparison from topProjects list
  const getCommits30d = (shortName: string) => {
    const found = topProjects.find(tp => tp.name === `group/${shortName}` || tp.name.endsWith(`/${shortName}`));
    return found?.commits30d ?? null;
  };

  // Compute maximum metrics for normalized graphs
  const chartData = useMemo(() => {
    if (selectedProjects.length === 0) return { maxCommit: 1, datasets: [], labels: [] };

    // Find the actual trend arrays based on chosen granularity
    const datasets = selectedProjects.map(p => {
      let data = p[granularity] || [];
      return {
        id: p.id,
        name: p.shortName,
        fullName: p.name,
        color: p.color,
        values: data
      };
    });

    const maxLen = Math.max(...datasets.map(d => d.values.length), 1);
    
    // Find absolute maximum commit value to properly align scaling
    const maxCommit = Math.max(
      ...datasets.flatMap(d => d.values),
      1
    );

    // Compute x labels
    let labels: string[] = [];
    if (granularity === 'monthly') {
      labels = monthLabels.length > 0 ? monthLabels : ['12月', '1月', '2月', '3月', '4月', '5月'];
    } else if (granularity === 'weekly') {
      // Subsample list for weekly (weeks 1 to N, spacing 8 weeks)
      labels = Array.from({ length: maxLen }, (_, i) => `W${i + 1}`);
    } else {
      labels = Array.from({ length: maxLen }, (_, i) => `${i + 1}/30`);
    }

    return { maxCommit, datasets, labels, maxLen };
  }, [selectedProjects, granularity, monthLabels]);

  // Filter project selection options
  const filteredOptions = useMemo(() => {
    return projects.filter(p => 
      p.shortName.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.name.toLowerCase().includes(projectSearch.toLowerCase())
    );
  }, [projects, projectSearch]);

  // Statistics for comparative summary cards
  const comparativeMetrics = useMemo(() => {
    return selectedProjects.map(p => {
      const gValues = p[granularity] || [];
      const totalCommits = gValues.reduce((a, b) => a + b, 0);
      const avgCommits = gValues.length > 0 ? Math.round((totalCommits / gValues.length) * 10) / 10 : 0;
      const peakCommit = Math.max(...gValues, 0);
      
      return {
        id: p.id,
        shortName: p.shortName,
        totalCommits,
        avgCommits,
        peakCommit,
        color: p.color
      };
    });
  }, [selectedProjects, granularity]);

  return (
    <div className="workspace-card bg-surface-container-lowest border border-outline-variant rounded-xl p-6 col-span-12 hover-ambient-shadow flex flex-col gap-6" id="multi-project-comparer-container">
      {/* Header section with toggle controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-primary w-5 h-5" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface">多项目快捷对比</h3>
            <span className="text-[10px] uppercase font-mono bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">Smart Compare</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">选择最多 5 个项目，即时交叉对比代码吞吐量、提交曲线、平均密度与研发状态。</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex bg-surface border border-outline-variant rounded-lg p-0.5 h-8 items-center select-none">
            {(['monthly', 'weekly', 'daily'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer h-full flex items-center ${
                  granularity === g
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface animate-none'
                }`}
              >
                {g === 'monthly' ? '月度趋势' : g === 'weekly' ? '周度趋势' : '每日趋势'}
              </button>
            ))}
          </div>

          {/* View mode buttons */}
          <div className="flex bg-surface border border-outline-variant rounded-lg p-0.5 h-8 items-center select-none">
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-2.5 rounded-md text-xs font-semibold h-full flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'overlay' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="叠加对比图"
            >
              <Layers size={13} />
              <span className="text-[11px]">叠加</span>
            </button>
            <button
              onClick={() => setViewMode('stack')}
              className={`px-2.5 rounded-md text-xs font-semibold h-full flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'stack' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="分堆雷达图"
            >
              <Columns size={13} />
              <span className="text-[11px]">分布</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main interactive comparison grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left pane: Project Checklist & picker sidebar */}
        <div className="lg:col-span-3 flex flex-col bg-surface/30 border border-outline-variant rounded-xl p-4 gap-3.5 h-[410px] overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/60">
            <span className="text-xs font-mono font-bold tracking-wider text-on-surface-variant uppercase">选择对比仓库 ({selectedIds.length}/5)</span>
            {selectedIds.length > 1 && (
              <button 
                onClick={clearSelection}
                className="text-[10px] text-primary hover:text-primary-fixed duration-150 cursor-pointer font-medium"
              >
                重置
              </button>
            )}
          </div>

          {/* Search box built in checklist */}
          <div className="relative flex items-center shrink-0">
            <input 
              type="text"
              placeholder="快速搜素仓库..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="w-full bg-surface-dim border border-outline rounded px-2.5 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 font-sans"
            />
            {projectSearch && (
              <X 
                size={12} 
                onClick={() => setProjectSearch('')} 
                className="absolute right-2.5 text-on-surface-variant hover:text-white cursor-pointer" 
              />
            )}
          </div>

          {/* Option list scrolls */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
            {filteredOptions.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const isMax = selectedIds.length >= 5 && !isSelected;
              // Palette indicator color
              const currentPaletteIdx = selectedIds.indexOf(p.id);
              const palette = currentPaletteIdx !== -1 ? PALETTE[currentPaletteIdx % PALETTE.length] : null;

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isMax}
                  onClick={() => toggleProject(p.id)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-left border cursor-pointer select-none transition-all ${
                    isSelected 
                      ? `${p.id === selectedProjects[0]?.id ? 'bg-primary/10 border-primary' : 'bg-surface border-outline'} shadow-sm` 
                      : 'hover:bg-white/5 border-transparent text-on-surface-variant hover:text-on-surface'
                  } ${isMax ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected 
                      ? 'bg-primary border-primary text-white' 
                      : 'border-outline-variant'
                  }`}>
                    {isSelected && <Check size={11} strokeWidth={3} />}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold truncate block text-on-surface pr-1">
                      {p.shortName}
                    </span>
                    <span className="text-[10px] text-on-surface-variant truncate block font-mono">
                      {p.name.split('/')[0]}
                    </span>
                  </div>

                  {/* Dynamic Color dot indicator */}
                  {palette && (
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20 shadow-sm"
                      style={{ backgroundColor: palette.stroke }}
                      title={`对比轨道色`}
                    />
                  )}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="text-center py-10">
                <p className="text-xs text-on-surface-variant">未找到匹配仓库</p>
              </div>
            )}
          </div>

          <div className="border-t border-outline-variant/60 pt-2 shrink-0">
            <p className="text-[9px] text-on-surface-variant/80 font-mono leading-relaxed">
              * 图表将采用颜色映射：
              <span className="inline-flex flex-wrap gap-1 mt-1">
                {selectedProjects.map((p, i) => (
                  <span key={p.id} className="px-1 rounded bg-white/5 border border-outline-variant flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color.stroke }} />
                    <span className="text-[9px] font-sans text-on-surface">{p.shortName}</span>
                  </span>
                ))}
              </span>
            </p>
          </div>
        </div>

        {/* Right pane: Visual comparison canvas & stats grid */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* Main Chart Card component */}
          <div className="bg-surface/20 border border-outline-variant rounded-2xl p-4 shrink-0 flex flex-col min-h-[290px]">
            {/* Legend & Meta details */}
            <div className="flex items-center justify-between mb-3 text-xs border-b border-outline-variant/30 pb-2">
              <span className="font-mono text-[10px] text-on-surface-variant font-bold tracking-wider uppercase">
                {granularity === 'daily' ? '每日提交活跃度频次对比 (Daily Frequency)' : granularity === 'weekly' ? '周度研发提交贡献图 (Weekly Code Commits)' : '月度累计提交趋势交叉对比 (Monthly Commits)'}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                  <span className="inline-block w-2.5 h-0.5 bg-dashed border border-t border-dashed stroke-on-surface-variant"/> 虚线表示组平均
                </span>
              </div>
            </div>

            {/* SVG Visualizations */}
            <div className="flex-1 w-full min-h-[200px] relative">
              {viewMode === 'overlay' ? (
                /* OVERLAYED VIEW: Superimpose lines on single canvas */
                <svg className="w-full h-full" viewBox="0 0 660 200" id="comparison-svg-overlay">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = 20 + ratio * 140;
                    const gridValue = Math.round(chartData.maxCommit * (1 - ratio));
                    return (
                      <g key={idx}>
                        <line x1="40" y1={y} x2="630" y2={y} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
                        <text x="32" y={y + 3} textAnchor="end" className="text-[9px] font-mono fill-on-surface-variant font-semibold">
                          {gridValue}
                        </text>
                      </g>
                    );
                  })}

                  <AnimatePresence>
                    {/* Render Line for each chosen project */}
                    {chartData.datasets.map((ds, dsIdx) => {
                      if (ds.values.length === 0) return null;
                      
                      const colW = 590 / Math.max(ds.values.length - 1, 1);
                      const pointsStr = ds.values.map((v, i) => {
                        const x = 40 + i * colW;
                        const y = 20 + 140 - (v / chartData.maxCommit) * 140;
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <g key={ds.id} className="group/line">
                          {/* Shaded Area under the line */}
                          <path
                            d={`M 40 160 ${ds.values.map((v, i) => `L ${40 + i * colW} ${20 + 140 - (v / chartData.maxCommit) * 140}`).join(' ')} L ${40 + (ds.values.length - 1) * colW} 160 Z`}
                            fill={ds.color.stroke}
                            fillOpacity={hoveredIndex === dsIdx ? 0.08 : 0.03}
                            className="transition-opacity duration-300"
                          />
                          
                          {/* Main line */}
                          <motion.polyline
                            points={pointsStr}
                            fill="none"
                            stroke={ds.color.stroke}
                            strokeWidth={hoveredIndex === dsIdx ? 3 : 2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-all duration-200 cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(dsIdx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.8 }}
                          />

                          {/* Data circles hover overlay */}
                          {ds.values.map((v, i) => {
                            const x = 40 + i * colW;
                            const y = 20 + 140 - (v / chartData.maxCommit) * 140;
                            const isSingleHov = hoveredIndex === dsIdx;

                            return (
                              <g key={i}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={isSingleHov ? 3.5 : 2}
                                  fill="#ffffff"
                                  stroke={ds.color.stroke}
                                  strokeWidth={isSingleHov ? 2.5 : 1.5}
                                  className="transition-all cursor-pointer"
                                  onMouseEnter={() => setHoveredIndex(dsIdx)}
                                  onMouseLeave={() => setHoveredIndex(null)}
                                />
                                {isSingleHov && v > 0 && (
                                  <text
                                    x={x}
                                    y={y - 8}
                                    textAnchor="middle"
                                    className="text-[9px] font-bold font-mono fill-white opacity-90 filter drop-shadow select-none pointer-events-none"
                                    style={{ fill: ds.color.stroke }}
                                  >
                                    {v}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}
                  </AnimatePresence>

                  {/* X-axis labels */}
                  {chartData.labels.map((lbl, idx) => {
                    // Sparsify labels on larger series
                    let show = true;
                    if (granularity === 'weekly') show = idx % 8 === 0 || idx === chartData.labels.length - 1;
                    if (granularity === 'daily') show = idx % 4 === 0 || idx === chartData.labels.length - 1;

                    if (!show) return null;
                    const x = 40 + idx * (590 / Math.max(chartData.labels.length - 1, 1));
                    return (
                      <text key={idx} x={x} y={184} textAnchor="middle" className="text-[9px] font-mono fill-on-surface-variant font-medium">
                        {lbl}
                      </text>
                    );
                  })}
                </svg>
              ) : (
                /* STACKED SPARKLINE GRID: Render stacked rows to compare curves independently */
                <div className="flex flex-col gap-3.5" id="stacked-comparison-fields">
                  {selectedProjects.map((p, pIdx) => {
                    const values = p[granularity] || [];
                    const maxLocal = Math.max(...values, 1);
                    const colW = 540 / Math.max(values.length - 1, 1);
                    const pointsStr = values.map((v, i) => `${40 + i * colW},${5 + 35 - (v / maxLocal) * 35}`).join(' ');

                    return (
                      <div 
                        key={p.id} 
                        className={`flex items-center justify-between border border-outline-variant/60 rounded-xl p-2.5 bg-surface-container/20 transition-all ${
                          hoveredIndex === pIdx ? 'border-primary/50 bg-secondary/5' : ''
                        }`}
                        onMouseEnter={() => setHoveredIndex(pIdx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Legend meta on left */}
                        <div className="w-[120px] shrink-0 truncate flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: p.color.stroke }} />
                            <span className="text-xs font-bold text-on-surface truncate leading-tight">{p.shortName}</span>
                          </div>
                          <span className="text-[9px] font-mono text-on-surface-variant font-medium lowercase">
                            峰值: {maxLocal}
                          </span>
                        </div>

                        {/* Sparkline track layout */}
                        <div className="flex-1 min-w-[300px] h-[45px] relative">
                          <svg className="w-full h-full" viewBox="0 0 600 45">
                            {/* Baseline */}
                            <line x1="40" y1="40" x2="580" y2="40" stroke="#334155" strokeWidth="0.8" />
                            {/* Points Plot path */}
                            {values.length > 0 && (
                              <>
                                <polyline
                                  points={pointsStr}
                                  fill="none"
                                  stroke={p.color.stroke}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                {values.map((v, idx) => {
                                  const x = 40 + idx * (540 / Math.max(values.length - 1, 1));
                                  const y = 5 + 35 - (v / maxLocal) * 35;
                                  const isSelected = hoveredIndex === pIdx;
                                  return (
                                    <circle
                                      key={idx}
                                      cx={x}
                                      cy={y}
                                      r={isSelected ? 2.5 : 1}
                                      fill="#ffffff"
                                      stroke={p.color.stroke}
                                      strokeWidth={1}
                                    />
                                  );
                                })}
                              </>
                            )}
                          </svg>
                        </div>

                        {/* Summary value */}
                        <div className="w-[100px] text-right shrink-0">
                          <span className="text-xs font-bold text-white font-mono flex items-center justify-end gap-1">
                            <GitCommit size={11} className={p.color.text} />
                            {values.reduce((a, b) => a + b, 0)}次
                          </span>
                          <span className="text-[8px] tracking-tight font-sans text-on-surface-variant block uppercase mt-0.5">
                            周期总计次数
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Side-by-Side metrics table comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {comparativeMetrics.map((met, colIdx) => {
              const fullProj = selectedProjects.find(p => p.id === met.id);
              const totalIndex = fullProj ? getCommits30d(fullProj.shortName) : null;
              
              return (
                <div 
                  key={met.id}
                  className={`border rounded-xl p-3.5 bg-surface-container/20 border-outline-variant duration-150 relative overflow-hidden group ${
                    met.color.border
                  }`}
                >
                  {/* Decorative glowing gradient top-border */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-0.5 transition-all"
                    style={{ backgroundColor: met.color.stroke }}
                  />

                  <div className="flex justify-between items-start pb-1.5 border-b border-outline-variant/50 mb-2.5">
                    <span className="text-xs font-bold text-white truncate pr-1">
                      {met.shortName}
                    </span>
                    <span className="text-[9.5px] font-mono text-on-surface-variant bg-white/5 border border-outline-variant/75 rounded px-1 shrink-0">
                      ID: {met.id}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-on-surface-variant">周期峰值提交:</span>
                      <span className="font-mono font-bold text-white text-xs">{met.peakCommit}次</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-on-surface-variant">周期平均提交:</span>
                      <span className="font-mono font-bold text-white text-xs">{met.avgCommits}次</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-on-surface-variant">近30天吞吐:</span>
                      <span className="font-mono font-bold text-primary-fixed text-xs">{totalIndex !== null ? `${totalIndex}次` : '正在拉取...'}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-outline-variant/30 mt-1">
                      <span className="text-on-surface-variant">代码健康评估:</span>
                      <span className="font-semibold text-[9.5px] text-tertiary flex items-center gap-0.5">
                        <TrendingUp size={10} /> 极高活跃
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty state cards slot placeholder if comparing less than 4 */}
            {Array.from({ length: Math.max(0, 4 - selectedProjects.length) }).map((_, placeholderIdx) => (
              <div 
                key={placeholderIdx}
                className="border border-dashed border-outline-variant/60 rounded-xl p-3.5 bg-transparent flex flex-col items-center justify-center text-center opacity-40 select-none min-h-[125px]"
              >
                <Plus size={14} className="text-on-surface-variant mb-1" />
                <span className="text-[10px] text-on-surface-variant font-medium max-w-[100px] leading-snug">
                  选择左侧其它项目在对比面板联动
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
