import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TagMetric } from '../types';

interface ReviewDrawerProps {
  tag: TagMetric | null;
  onClose: () => void;
}

export const ReviewDrawer: React.FC<ReviewDrawerProps> = ({ tag, onClose }) => {
  return (
    <AnimatePresence>
      {tag && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Topic Inspector
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{tag.name}</h2>
                <div className="flex items-center mt-3 space-x-4 text-sm">
                  <span className="flex items-center text-slate-600 font-medium">
                    <ThumbsUp className="w-4 h-4 mr-1.5 text-slate-400" />
                    {tag.totalLikes.toLocaleString()} Impact
                  </span>
                  <span className="flex items-center text-emerald-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    {tag.positiveCount} Positive
                  </span>
                  <span className="flex items-center text-rose-600 font-medium">
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    {tag.negativeCount} Negative
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-50/30">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 sticky top-0 bg-slate-50/95 py-2 z-10 border-b border-slate-100">
                User Verbatim ({(tag.reviews || []).length})
              </h3>

              {(tag.reviews || []).map((review) => (
                <div
                  key={review.id}
                  className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`
                        px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
                        ${review.sentiment === 'Positive'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : review.sentiment === 'Negative'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-slate-50 text-slate-600 border-slate-100'
                      }
                    `}>
                      {review.sentiment}
                    </div>
                    <div className="flex items-center text-slate-400 text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(review.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {review.review_text}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex text-amber-400 text-xs">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? "text-amber-400" : "text-slate-200"}>★</span>
                      ))}
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      +{review.thumbs_up_count} likes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};