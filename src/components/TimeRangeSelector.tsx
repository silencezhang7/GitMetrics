import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type PredefinedRange = '7' | '30' | '90' | 'custom';

export interface DateRangeState {
  range: PredefinedRange;
  since?: string; // YYYY-MM-DD
  until?: string; // YYYY-MM-DD
}

interface TimeRangeSelectorProps {
  value: DateRangeState;
  onChange: (value: DateRangeState) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSince, setTempSince] = useState(value.since || '');
  const [tempUntil, setTempUntil] = useState(value.until || '');

  const getLabel = () => {
    switch (value.range) {
      case '7': return '最近 7 天';
      case '30': return '最近 30 天';
      case '90': return '最近 90 天';
      case 'custom':
        if (value.since && value.until) {
          return `${value.since} ~ ${value.until}`;
        }
        return '自定义范围';
      default: return '时间范围';
    }
  };

  const selectRange = (range: PredefinedRange) => {
    if (range !== 'custom') {
      const now = new Date();
      const untilStr = now.toISOString().substring(0, 10);
      const sinceDate = new Date();
      sinceDate.setDate(now.getDate() - Number(range));
      const sinceStr = sinceDate.toISOString().substring(0, 10);
      
      onChange({
        range,
        since: sinceStr,
        until: untilStr
      });
      setIsOpen(false);
    } else {
      onChange({
        ...value,
        range: 'custom'
      });
    }
  };

  const applyCustomRange = () => {
    if (tempSince && tempUntil) {
      onChange({
        range: 'custom',
        since: tempSince,
        until: tempUntil
      });
      setIsOpen(false);
    }
  };

  // Sync state if value updates from outside
  useEffect(() => {
    if (value.since) setTempSince(value.since);
    if (value.until) setTempUntil(value.until);
  }, [value.since, value.until]);

  return (
    <div className="relative inline-block text-left z-20" id="time-range-group">
      <button
        id="time-range-toggle-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-surface-container hover:bg-surface-container-high text-white text-xs font-medium rounded-lg border border-outline hover:border-secondary transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-secondary select-none"
      >
        <Calendar className="w-3.5 h-3.5 text-secondary" />
        <span className="font-sans font-medium text-on-surface-variant">{getLabel()}</span>
        <ChevronDown className={`w-3 h-3 text-secondary-dim transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close click outside */}
            <div 
              className="fixed inset-0 z-10 cursor-default" 
              onClick={() => setIsOpen(false)} 
            />
            
            <motion.div
              id="time-range-dropdown"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 bg-surface-container-highest border border-outline rounded-xl opacity-100 shadow-xl z-20 py-2.5 overflow-hidden font-sans"
            >
              <div className="px-3 pb-2 border-b border-outline mb-1.5 flex justify-between items-center">
                <span className="text-2xs font-mono font-medium tracking-tight text-secondary-dim uppercase">选择统计范围</span>
              </div>
              
              <ul className="space-y-0.5 px-1.5">
                {[
                  { key: '7' as const, label: '最近 7 天 (Last 7 Days)' },
                  { key: '30' as const, label: '最近 30 天 (Last 30 Days)' },
                  { key: '90' as const, label: '最近 90 天 (Last 90 Days)' }
                ].map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => selectRange(item.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer select-none ${
                        value.range === item.key 
                          ? 'bg-secondary/10 text-secondary' 
                          : 'hover:bg-white/5 text-on-surface hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {value.range === item.key && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </li>
                ))}

                <li>
                  <button
                    type="button"
                    onClick={() => selectRange('custom')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer select-none ${
                      value.range === 'custom' 
                        ? 'bg-secondary/10 text-secondary' 
                        : 'hover:bg-white/5 text-on-surface hover:text-white'
                    }`}
                  >
                    <span>自定义时间范围 (Custom Range)</span>
                    {value.range === 'custom' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </li>
              </ul>

              {value.range === 'custom' && (
                <div className="mt-3 px-3 py-2.5 border-t border-outline/50 bg-surface-container">
                  <span className="block text-3xs font-mono tracking-wider text-secondary-dim uppercase mb-2">手动输入起止日期</span>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-4xs text-secondary-dim mb-1 font-mono uppercase">起始日期</label>
                      <input
                        type="date"
                        value={tempSince}
                        onChange={(e) => setTempSince(e.target.value)}
                        className="w-full text-xs font-mono bg-surface-container-highest border border-outline rounded px-2.5 py-1 text-white focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-4xs text-secondary-dim mb-1 font-mono uppercase">结束日期</label>
                      <input
                        type="date"
                        value={tempUntil}
                        onChange={(e) => setTempUntil(e.target.value)}
                        className="w-full text-xs font-mono bg-surface-container-highest border border-outline rounded px-2.5 py-1 text-white focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!tempSince || !tempUntil}
                      onClick={applyCustomRange}
                      className="w-full mt-1.5 py-1.5 bg-secondary hover:bg-secondary-dim text-neutral-900 hover:text-black font-sans font-medium text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      确定并应用 (Apply)
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
