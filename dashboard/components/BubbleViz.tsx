import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeMetric, TagMetric } from '../types';

interface BubbleVizProps {
  theme: ThemeMetric;
  onTagSelect: (tag: TagMetric) => void;
}

export const BubbleViz: React.FC<BubbleVizProps> = ({ theme, onTagSelect }) => {
  // Sort tags by size (likes) to help packing
  const sortedTags = [...theme.tags].sort((a, b) => b.totalLikes - a.totalLikes);

  // Determine scale
  const minLikes = Math.min(...sortedTags.map(t => t.totalLikes));
  const maxLikes = Math.max(...sortedTags.map(t => t.totalLikes));
  
  // Clamping function for bubble size (pixels)
  const getBubbleSize = (likes: number) => {
    // Slightly smaller minimum size for better mobile fit
    const minSize = 100;
    const maxSize = 220;
    if (maxLikes === minLikes) return maxSize;
    const scale = (likes - minLikes) / (maxLikes - minLikes);
    return minSize + (scale * (maxSize - minSize));
  };

  return (
    <div className="w-full h-full p-4 md:p-8 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200/60 inner-shadow">
      <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 min-h-[400px] md:min-h-[500px] content-center">
        <AnimatePresence mode="popLayout">
          {sortedTags.map((tag) => {
            const size = getBubbleSize(tag.totalLikes);
            const totalSent = tag.positiveCount + tag.negativeCount;
            const negPct = totalSent === 0 ? 0 : (tag.negativeCount / totalSent) * 100;
            
            // Smoother Gradient Logic
            // Instead of a hard stop, create a transition zone of +/- 20% around the split point.
            // This visually represents the ratio while looking aesthetically pleasing.
            const transitionZone = 20;
            const stop1 = Math.max(0, negPct - transitionZone);
            const stop2 = Math.min(100, negPct + transitionZone);

            const background = `linear-gradient(135deg, #e11d48 ${stop1}%, #059669 ${stop2}%)`;

            return (
              <motion.div
                key={tag.name}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                onClick={() => onTagSelect(tag)}
                style={{
                  width: size,
                  height: size,
                  background: background,
                }}
                className="rounded-full flex flex-col items-center justify-center text-center cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden group border-2 border-white ring-1 ring-slate-100/50"
              >
                {/* Overlay for legibility on gradient */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                
                <div className="relative z-10 px-3">
                  <p className="text-white font-semibold text-xs md:text-sm leading-tight drop-shadow-md mb-1 break-words line-clamp-3">
                    {tag.name}
                  </p>
                  <p className="text-white/90 text-[10px] md:text-xs font-mono drop-shadow-md bg-black/20 px-2 py-0.5 rounded-full inline-block backdrop-blur-sm">
                    {tag.totalLikes.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};