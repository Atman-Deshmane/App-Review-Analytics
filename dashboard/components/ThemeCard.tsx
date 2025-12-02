import React from 'react';
import { motion } from 'framer-motion';
import { ThemeMetric } from '../types';
import { calculateSentimentPercentage } from '../utils/dataProcessing';

interface ThemeCardProps {
  theme: ThemeMetric;
  isSelected: boolean;
  onClick: () => void;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isSelected, onClick }) => {
  const totalSentimentCount = theme.positiveCount + theme.negativeCount;
  const positivePct = calculateSentimentPercentage(theme.positiveCount, totalSentimentCount);
  const negativePct = 100 - positivePct;

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex flex-col justify-between p-5 text-left transition-all duration-200
        bg-white border rounded-lg h-36 min-w-[260px] md:min-w-0 w-full group snap-center
        ${isSelected 
          ? 'border-slate-300 shadow-md ring-1 ring-slate-200' 
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }
      `}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active Indicator Top Border */}
      {isSelected && (
        <motion.div 
          layoutId="active-border"
          className="absolute top-0 left-0 w-full h-1 bg-slate-800 rounded-t-lg"
        />
      )}

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 truncate">
          {theme.name}
        </h3>
        <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-semibold text-slate-800 tabular-nums tracking-tight">
                {theme.totalLikes.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">IMPACT SCORE</span>
        </div>
      </div>

      <div className="w-full mt-4">
        <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            <span>Sentiment Split</span>
            <span>{positivePct}% POSITIVE</span>
        </div>
        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-100">
          <div 
            className="bg-emerald-500 h-full" 
            style={{ width: `${positivePct}%` }}
          />
          <div 
            className="bg-rose-500 h-full" 
            style={{ width: `${negativePct}%` }}
          />
        </div>
      </div>
    </motion.button>
  );
};