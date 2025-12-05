import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Loader2, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalLoaderProps {
    status: string;
    progress: number;
    logs: string[];
    error?: string | null;
    reviewCount?: number;
    onComplete?: () => void;
}

// Hollywood-style log formatter
const formatLogMessage = (rawLog: string): { message: string; highlight?: string } | null => {
    // Filter out jargon/technical logs
    const jargonPatterns = [
        /^Process ID/i,
        /^Job ID/i,
        /^Run python/i,
        /^env:/i,
        /download action/i,
        /^Running:/i,
        /pythonLocation/i,
        /PKG_CONFIG/i,
        /Python_ROOT/i,
        /LD_LIBRARY/i,
        /shell:/i,
        /^\[job_/i,
        /Dispatching workflow/i,
        /Workflow dispatched/i,
    ];

    for (const pattern of jargonPatterns) {
        if (pattern.test(rawLog)) return null;
    }

    // Transform logs into engaging messages (User Logic)

    if (rawLog.includes("Fetching")) {
        return { message: "📡 Intercepting app signals from Play Store..." };
    }

    if (rawLog.includes("Identifying Strategic Themes")) {
        return { message: "🧠 AI Neural Core: Pattern Recognition Active..." };
    }

    if (rawLog.includes("Analyzing Theme")) {
        // Extract theme name "Analyzing Theme: Pricing..." -> "🔍 Deep Dving: Pricing"
        const themeMatch = rawLog.split(":")[1] || "Data";
        const theme = themeMatch.replace(/\.{3}$/, '').trim(); // Remove trailing dots if any
        return {
            message: `🔍 Analyzing Segment:`,
            highlight: theme
        };
    }

    if (rawLog.includes("Tagging")) {
        return { message: "🏷️ Semantic Tagging & Sentiment Scoring..." };
    }

    if (rawLog.includes("Archiving")) {
        return { message: "💾 Encrypting and Securing Data Vault..." };
    }

    if (rawLog.includes("Sending email")) {
        return { message: "📨 Dispatching Executive Briefing..." };
    }

    // Keep some existing useful mappings that don't conflict
    if (rawLog.includes('Themes Identified') || rawLog.includes('Themes:')) {
        const themesMatch = rawLog.match(/\[([^\]]+)\]/);
        if (themesMatch) {
            const themes = themesMatch[1].split(',').map(t => t.trim().replace(/'/g, '')).slice(0, 4);
            return {
                message: `🧠 AI Detected Patterns:`,
                highlight: themes.join(' • ')
            };
        }
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

    // For any unmatched but interesting logs
    if (rawLog.includes('Error') || rawLog.includes('FAILURE')) {
        return { message: `⚠️ ${rawLog}` };
    }

    // Skip empty or very short logs
    if (rawLog.trim().length < 5) return null;

    // For [STATUS] prefixed logs, clean them up
    if (rawLog.includes('[STATUS]')) {
        const cleaned = rawLog.replace('[STATUS]', '').trim();
        if (cleaned.length > 5) {
            return { message: `⚙️ ${cleaned}` };
        }
        return null;
    }

    // Default: return cleaned version
    return { message: `⚙️ ${rawLog.substring(0, 60)}${rawLog.length > 60 ? '...' : ''}` };
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

                {/* Footer */}
                <div className="px-6 pb-4">
                    <div className="text-center text-slate-500 text-xs">
                        {isComplete
                            ? "🎉 Your insights are ready!"
                            : "You can close this window. We'll email you when it's ready."}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TerminalLoader;
