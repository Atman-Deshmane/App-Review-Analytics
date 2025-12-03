import React, { useEffect, useRef } from 'react';
import { Terminal, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TerminalLoaderProps {
    status: string;
    progress: number;
    logs: string[];
    error?: string | null;
}

const TerminalLoader: React.FC<TerminalLoaderProps> = ({ status, progress, logs, error }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 z-50 font-mono">
            <div className="w-full max-w-2xl bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 p-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Terminal size={16} className="text-slate-400" />
                        <span className="text-sm text-slate-400">Analysis Console</span>
                    </div>
                    <div className="flex space-x-1.5">
                        <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-slate-900 w-full">
                    <motion.div
                        className={`h-full ${error ? 'bg-rose-600' : 'bg-indigo-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status */}
                    <div className="flex items-center space-x-3">
                        {error ? (
                            <div className="p-2 bg-rose-500/10 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-rose-500" />
                            </div>
                        ) : (
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                            </div>
                        )}
                        <div>
                            <div className={`text-lg font-bold ${error ? 'text-rose-500' : 'text-slate-200'}`}>
                                {error ? 'Analysis Failed' : status}
                            </div>
                            <div className="text-xs text-slate-500">
                                {error ? 'Process terminated unexpectedly' : `Process ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`}
                            </div>
                        </div>
                    </div>

                    {/* Logs */}
                    <div
                        ref={scrollRef}
                        className="h-64 bg-slate-900/50 rounded-lg p-4 overflow-y-auto custom-scrollbar border border-slate-800/50"
                    >
                        <div className="space-y-1">
                            {logs.map((log, i) => (
                                <div key={i} className="text-xs font-mono flex">
                                    <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                    <span className={log.includes('Error') || log.includes('FAILURE') ? 'text-rose-400' : 'text-emerald-400'}>
                                        {log}
                                    </span>
                                </div>
                            ))}
                            {error && (
                                <div className="mt-4 p-2 border border-rose-500 bg-rose-900/20 text-rose-400 font-mono text-xs break-all">
                                    CRITICAL FAILURE: {error}
                                    <br />
                                    <button
                                        className="mt-2 px-3 py-1 bg-rose-600 text-white hover:bg-rose-700 rounded transition-colors"
                                        onClick={() => window.location.reload()}
                                    >
                                        RESET SYSTEM
                                    </button>
                                </div>
                            )}
                            <div className="animate-pulse text-indigo-500">_</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TerminalLoader;
