import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TerminalLoaderProps {
    status: string;
    progress: number;
    logs: string[];
}

const TerminalLoader: React.FC<TerminalLoaderProps> = ({ status, progress, logs }) => {
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-500 font-mono p-4">
            <div className="w-full max-w-2xl border border-green-800 rounded-lg overflow-hidden bg-black shadow-[0_0_20px_rgba(0,255,0,0.1)]">
                {/* Terminal Header */}
                <div className="bg-green-900/20 border-b border-green-800 p-2 flex items-center justify-between">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                    <div className="text-xs text-green-700">root@orchestrator:~</div>
                </div>

                {/* Progress Bar */}
                <div className="p-4 border-b border-green-900/30">
                    <div className="flex justify-between mb-2 text-sm">
                        <span>STATUS: {status.toUpperCase()}</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-green-900/20 h-2 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>

                {/* Logs Area */}
                <div className="h-64 overflow-y-auto p-4 space-y-1 font-mono text-sm custom-scrollbar">
                    {logs.map((log, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <span className="text-green-700 mr-2">{'>'}</span>
                            {log}
                        </motion.div>
                    ))}
                    {/* Blinking Cursor */}
                    <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-2 h-4 bg-green-500 ml-1 align-middle"
                    />
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    );
};

export default TerminalLoader;
