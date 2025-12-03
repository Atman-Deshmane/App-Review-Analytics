import React, { useState } from 'react';
import { X, Lock, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (config: AnalysisConfig) => void;
    appId: string;
}

export interface AnalysisConfig {
    count: number;
    themes: string;
    email: string;
    dateRange: number; // weeks
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onStart, appId }) => {
    const [count, setCount] = useState(300);
    const [themes, setThemes] = useState('');
    const [email, setEmail] = useState('');
    const [dateRange, setDateRange] = useState(12);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Start Analysis clicked. Payload:", { count, themes: themes || 'auto', email, dateRange });
        if (!email) return;
        onStart({ count, themes: themes || 'auto', email, dateRange });
    };

    const reviewOptions = [
        { value: 50, label: '50 Reviews', time: '~1 min' },
        { value: 100, label: '100 Reviews', time: '~3 mins' },
        { value: 200, label: '200 Reviews', time: '~5 mins' },
        { value: 300, label: '300 Reviews', time: '~8 mins' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-800">Configure Analysis</h2>
                                    <p className="text-sm text-slate-500 mt-1">Target: <span className="font-mono text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">{appId}</span></p>
                                </div>
                                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Review Count Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Analysis Depth</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {reviewOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setCount(option.value)}
                                                className={`p-3 rounded-xl border text-left transition-all ${count === option.value
                                                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className={`font-medium ${count === option.value ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    {option.label}
                                                </div>
                                                <div className={`text-xs mt-1 ${count === option.value ? 'text-indigo-700' : 'text-slate-500'}`}>
                                                    Est. {option.time}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Themes Input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Custom Themes <span className="text-slate-400 font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={themes}
                                        onChange={(e) => setThemes(e.target.value)}
                                        placeholder="e.g. Login, KYC, Payments (Leave empty for auto-detect)"
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Email Input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Delivery Email <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock size={16} className="text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5">
                                        We'll send the full PDF report here once complete.
                                    </p>
                                </div>

                                {/* Action Button */}
                                <button
                                    type="submit"
                                    disabled={!email}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
                                >
                                    <Play size={18} />
                                    <span>Start Analysis</span>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfigModal;
