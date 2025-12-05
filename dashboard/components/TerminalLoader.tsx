import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Loader2, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalLoaderProps {
    status: string;
    progress: number;
    logs: string[];
    error?: string | null;
    reviewCount?: number;
    email?: string;
    onComplete?: () => void;
}

// Hollywood-style log formatter
const formatLogMessage = (rawLog: string): { message: string; highlight?: string; style?: string } | null => {
    // 1. HARD FILTERS (Technical Noise)
    const noiseFilter = [
        "csv", "json", "Saved to", "STATS", "metadata",
        "Process ID", "Job ID", "Run python", "env:", "download action", "Running:",
        "pythonLocation", "PKG_CONFIG", "Python_ROOT", "LD_LIBRARY", "shell:",
        "[job_", "Dispatching workflow", "Workflow dispatched", "Displaying", "Using", "Filtering"
    ];

    if (noiseFilter.some(keyword => rawLog.toLowerCase().includes(keyword.toLowerCase()))) {
        return null;
    }

    // [HIGHLIGHT] Logic
    if (rawLog.startsWith("[HIGHLIGHT] Top Review:")) {
        const content = rawLog.replace("[HIGHLIGHT] Top Review:", "").trim();
        return {
            message: content,
            highlight: "💬 Featured Review", // Special indicator
            style: "italic text-cyan-400"
        };
    }

    if (rawLog.startsWith("[HIGHLIGHT] Themes Identified:") || rawLog.startsWith("[HIGHLIGHT] Themes Detected:")) {
        const content = rawLog.split(":")[1].trim();
        return {
            message: "Themes Detected:",
            highlight: content,
            style: "font-bold text-green-400"
        };
    }

    // 2. EMOJI MAPPINGS
    if (rawLog.includes("Fetching")) {
        return { message: "📡 Intercepting app signals from Play Store..." };
    }
    if (rawLog.includes("Identifying Strategic Themes")) {
        return { message: "🧠 AI Neural Core: Pattern Recognition Active..." };
    }
    if (rawLog.includes("Analysing") || rawLog.includes("Analyzing")) {
        return { message: "🧠 Analysing semantic patterns..." };
    }
    if (rawLog.includes("Tagging")) {
        return { message: "🏷️ Semantic Tagging & Sentiment Scoring..." };
    }
    if (rawLog.includes("Uploading") || rawLog.includes("Archiving")) {
        return { message: "☁️ Uploading to secure cloud storage..." };
    }
    if (rawLog.includes("Sending email")) {
        return { message: "📨 Dispatching Executive Briefing..." };
    }
    if (rawLog.includes('Report generated')) {
        return { message: `📊 Leadership briefing compiled successfully` };
    }
    if (rawLog.includes('COMPLETED') || rawLog.includes('100%')) {
        return { message: `✅ Analysis complete! Preparing your dashboard...` };
    }
    if (rawLog.includes('Firebase initialized')) {
        return { message: `🔥 Secure connection established` };
    }

    // 3. GEAR ICON FILTER (Only for Specific Ops)
    if (rawLog.includes("Initializing") || rawLog.includes("Connecting")) {
        return { message: `⚙️ ${rawLog}` };
    }

    // Default Filter: If it starts with a gear/default, assume it's noise unless allowed above
    // Actually, looking at previous logic, we returned a gear icon for everything else. 
    // Now user says: "Any log starting with ⚙️ unless it contains Initializing or Connecting."
    // Since our default *adds* the gear, we basically filter out anything else not caught above?
    // Let's be safe: If it's a short status or meaningful, keep it. 
    // User instruction: "Update processLog to return null (hide) for ... Any log starting with ⚙️ unless..."
    // This implies we should be aggressive with hiding.

    if (rawLog.length > 5 && !rawLog.includes("[STATUS]")) {
        // Should we show it? The user only wants to hide generic gear logs.
        // Let's return null for generic unknown logs to "clean up" completely as requested.
        return null;
    }

    // For [STATUS] prefixed logs, clean them up
    if (rawLog.includes('[STATUS]')) {
        const cleaned = rawLog.replace('[STATUS]', '').trim();
        return { message: `⚙️ ${cleaned}` };
    }

    return null;
};

// Format time remaining
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const TerminalLoader: React.FC<TerminalLoaderProps> = ({
    status,
    progress,
    logs,
    error,
    reviewCount = 100,
    email,
    onComplete
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isComplete, setIsComplete] = useState(false);

    // Calculate initial time based on review count
    useEffect(() => {
        // Estimate: ~1.5 minutes per 100 reviews
        const baseTime = Math.ceil((reviewCount / 100) * 90);
        setTimeRemaining(baseTime);
    }, [reviewCount]);

    // Countdown timer
    useEffect(() => {
        if (timeRemaining <= 0 || isComplete || error) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining, isComplete, error]);

    // Detect completion
    useEffect(() => {
        if (status?.includes('COMPLETED') || progress >= 100) {
            setIsComplete(true);
            setTimeRemaining(0);
        }
    }, [status, progress]);

    // Auto-scroll logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Process logs for display
    const formattedLogs = logs
        .map(log => formatLogMessage(log))
        .filter((log): log is { message: string; highlight?: string } => log !== null)
        .slice(-15); // Keep last 15 meaningful logs

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4 z-50 font-mono">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-indigo-500/30 rounded-full"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: window.innerHeight + 10
                        }}
                        animate={{
                            y: -10,
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                    />
                ))}
            </div>

            <div className="w-full max-w-2xl bg-slate-950/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-500/10 overflow-hidden relative">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Terminal size={18} className="text-indigo-400" />
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-slate-200">AI Analysis Console</span>
                            <div className="text-xs text-slate-500">Gemini 2.5 Flash</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Time Remaining */}
                        {!isComplete && !error && (
                            <div className="text-right">
                                <div className="text-xs text-slate-500">Time Remaining</div>
                                <div className="text-lg font-bold text-indigo-400 tabular-nums">
                                    {formatTime(timeRemaining)}
                                </div>
                            </div>
                        )}
                        <div className="flex space-x-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-900 w-full relative overflow-hidden">
                    <motion.div
                        className={`h-full ${error ? 'bg-gradient-to-r from-rose-600 to-rose-500' : isComplete ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                    {!error && !isComplete && (
                        <motion.div
                            className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: ['-100%', '400%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                    )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Status */}
                    <div className="flex items-center space-x-4">
                        <AnimatePresence mode="wait">
                            {error ? (
                                <motion.div
                                    key="error"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/30"
                                >
                                    <AlertTriangle className="w-7 h-7 text-rose-500" />
                                </motion.div>
                            ) : isComplete ? (
                                <motion.div
                                    key="complete"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30"
                                >
                                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="loading"
                                    className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/30"
                                >
                                    <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="flex-1">
                            <div className={`text-xl font-bold ${error ? 'text-rose-400' : isComplete ? 'text-emerald-400' : 'text-slate-100'}`}>
                                {error ? 'Analysis Failed' : isComplete ? 'Analysis Complete!' : status || 'Processing...'}
                            </div>
                            <div className="text-sm text-slate-500 flex items-center mt-1">
                                {isComplete ? (
                                    <span className="flex items-center text-emerald-400">
                                        <Sparkles size={14} className="mr-1" />
                                        Redirecting to dashboard...
                                    </span>
                                ) : (
                                    <span>{progress}% complete • {reviewCount} reviews</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Logs */}
                    <div
                        ref={scrollRef}
                        className="h-72 bg-slate-900/70 rounded-xl p-4 overflow-y-auto custom-scrollbar border border-slate-700/30"
                    >
                        <div className="space-y-2">
                            <AnimatePresence>
                                {formattedLogs.map((log, i) => (
                                    <motion.div
                                        key={`${i}-${log.message}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-sm font-mono flex flex-wrap items-center"
                                    >
                                        <span className="text-slate-600 mr-2 text-xs">
                                            [{new Date().toLocaleTimeString('en-US', { hour12: false })}]
                                        </span>
                                        <span className="text-slate-300">{log.message}</span>
                                        {log.highlight && (
                                            <span className="ml-2 text-emerald-400 font-semibold">
                                                {log.highlight}
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-4 p-3 border border-rose-500/50 bg-rose-950/50 text-rose-300 rounded-lg text-sm"
                                >
                                    <div className="font-semibold mb-2">⛔ CRITICAL FAILURE</div>
                                    <div className="text-rose-400/80 break-all">{error}</div>
                                    <button
                                        className="mt-3 px-4 py-2 bg-rose-600 text-white hover:bg-rose-500 rounded-lg transition-colors font-semibold text-sm"
                                        onClick={() => window.location.reload()}
                                    >
                                        🔄 RETRY ANALYSIS
                                    </button>
                                </motion.div>
                            )}

                            {!error && !isComplete && (
                                <motion.div
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="text-indigo-400 text-lg"
                                >
                                    ▋
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800/50 p-3 bg-slate-900/30 flex justify-between items-center relative z-10 backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                        {isComplete ? (
                            <div className="flex items-center space-x-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <div>
                                    <span className="text-emerald-400 font-bold text-sm tracking-wide">✨ generating a beautiful dashboard...</span>
                                    <div className="text-slate-500 text-xs mt-0.5">Deployment in progress. Redirecting in 15 seconds.</div>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex items-center space-x-2">
                                <AlertTriangle size={14} className="text-rose-500" />
                                <span className="text-rose-500 font-medium text-xs">Analysis Failed</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <span className="text-slate-400 font-medium text-xs">
                                    {progress >= 90 ? 'Finalizing Report...' : 'Processing Reviews...'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="text-right">
                        {!isComplete && !error && email && (
                            <div className="text-slate-400 text-xs">
                                We will email the report to: <span className="text-amber-300 font-bold text-lg mx-1">{email}</span> once deployment finishes.
                                <div className="text-slate-500 text-[10px] mt-1">You can close this window.</div>
                            </div>
                        )}
                        {!email && (
                            <div className="text-slate-500 text-xs font-mono ml-4">v2.5.0-alpha</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TerminalLoader;
