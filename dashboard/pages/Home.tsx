import React, { useState, useEffect } from 'react';
import { Search, History, Star, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfigModal, { AnalysisConfig } from '../components/ConfigModal';
import TerminalLoader from '../components/TerminalLoader';
import { subscribeToJob, JobStatus } from '../utils/firebase';
import { triggerAnalysis } from '../utils/githubApi';
import { Manifest, ManifestApp } from '../types';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [history, setHistory] = useState<Manifest>({});
    const [showHistory, setShowHistory] = useState(false);
    const [viewState, setViewState] = useState<'SEARCH' | 'CONFIG' | 'LOADING'>('SEARCH');

    // Config State
    const [targetAppId, setTargetAppId] = useState('');
    const [jobId, setJobId] = useState('');
    const [reviewCount, setReviewCount] = useState(100);

    // Loading State
    const [jobStatus, setJobStatus] = useState<JobStatus>({ status: 'Initializing...', progress: 0, last_update: '' });
    const [logs, setLogs] = useState<string[]>([]);
    const [debugError, setDebugError] = useState<string | null>(null);

    useEffect(() => {
        // Load Manifest
        fetch(`${import.meta.env.BASE_URL}manifest.json`)
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => console.error("Failed to load history:", err));
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Check if it's a Play Store URL
        if (query.includes('play.google.com')) {
            const idMatch = query.match(/id=([a-zA-Z0-9_.]+)/);
            if (idMatch) {
                setTargetAppId(idMatch[1]);
                setSearchQuery('');
                setViewState('CONFIG');
            }
        }
    };

    const startAnalysis = async (config: AnalysisConfig) => {
        setViewState('LOADING');
        setReviewCount(config.count);
        const newJobId = `job_${Date.now()}`;
        setJobId(newJobId);
        setLogs(['🚀 Initializing analysis pipeline...']);

        try {
            // Trigger GitHub Dispatch
            setLogs(prev => [...prev, `📡 Connecting to cloud infrastructure...`]);

            await triggerAnalysis({
                appId: targetAppId,
                count: config.count,
                email: config.email,
                themes: config.themes,
                jobId: newJobId,
                startDate: config.startDate,
                endDate: config.endDate
            });

            setLogs(prev => [...prev, `✅ Cloud workflow activated successfully`]);
            setLogs(prev => [...prev, `🔗 Establishing real-time monitoring...`]);

            // Subscribe to Firebase
            const unsubscribe = subscribeToJob(newJobId, (data) => {
                setJobStatus(data);

                // Add status to logs
                if (data.status && !data.status.includes('[STATUS]')) {
                    setLogs(prev => [...prev, data.status]);
                }

                // Check for completion - multiple ways to detect
                const isCompleted =
                    data.status?.toUpperCase().includes('COMPLETED') ||
                    data.progress >= 100 ||
                    data.status?.includes('100%');

                if (isCompleted) {
                    setLogs(prev => [...prev, `🎉 Analysis complete! Preparing dashboard...`]);

                    // Generate version string
                    const today = new Date().toISOString().split('T')[0];
                    const version = `${today}_${config.count}reviews`;

                    // Wait for dramatic effect + deployment propagation
                    setTimeout(() => {
                        setLogs(prev => [...prev, `🚀 Redirecting to your insights...`]);

                        // Force redirect after another second
                        setTimeout(() => {
                            navigate(`/dashboard?app=${targetAppId}&version=${version}`);
                        }, 1000);
                    }, 2000);

                    // Unsubscribe after completion
                    if (unsubscribe) unsubscribe();
                }
            });

        } catch (error: any) {
            console.error("Failed to start analysis:", error);
            const errorMessage = error.message || String(error);
            setDebugError(errorMessage);
            setLogs(prev => [...prev, `⛔ [FATAL ERROR] ${errorMessage}`]);
        }
    };

    if (viewState === 'LOADING') {
        return (
            <TerminalLoader
                status={jobStatus.status}
                progress={jobStatus.progress}
                logs={logs}
                error={debugError}
                reviewCount={reviewCount}
            />
        );
    }

    const filteredHistory: [string, ManifestApp][] = Object.entries(history).filter(([id, app]) => {
        const manifestApp = app as ManifestApp;
        return id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (manifestApp.name && manifestApp.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }) as [string, ManifestApp][];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl text-center space-y-8">

                {/* Hero */}
                <div className="space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4">
                        <Activity className="text-indigo-600" size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                        App Review Analytics
                    </h1>
                    <p className="text-lg text-slate-600 max-w-xl mx-auto">
                        Turn thousands of Play Store reviews into actionable insights in minutes.
                        Paste a link to get started.
                    </p>
                </div>

                {/* Search Input */}
                <div className="relative max-w-2xl mx-auto group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        onFocus={() => setShowHistory(true)}
                        // onBlur={() => setTimeout(() => setShowHistory(false), 200)} // Delay to allow clicks
                        placeholder="Paste Play Store Link or Search History..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-lg transition-all"
                    />

                    {/* History Dropdown */}
                    {showHistory && (searchQuery || Object.keys(history).length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-10 text-left">
                            <div className="p-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                <History size={12} className="mr-1.5" /> Recent Analysis
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map(([id, app]) => (
                                        <button
                                            key={id}
                                            onClick={() => navigate(`/dashboard?app=${id}&version=${app.latest}`)}
                                            className="w-full p-3 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 font-bold text-xs">
                                                    {app.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium text-slate-800">{app.name || id}</div>
                                                    <div className="text-xs text-slate-500">{id}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-emerald-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Star size={12} className="mr-1 fill-current" />
                                                Ready Instantly
                                                <ArrowRight size={14} className="ml-2" />
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-slate-400 text-sm">
                                        No history found. Paste a link to start new.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="pt-8 flex justify-center space-x-6 text-slate-400 text-sm">
                    <span>Powered by Gemini 1.5 Pro</span>
                    <span>•</span>
                    <span>NextLeap Milestone 2</span>
                </div>

            </div>

            <ConfigModal
                isOpen={viewState === 'CONFIG'}
                onClose={() => setViewState('SEARCH')}
                onStart={startAnalysis}
                appId={targetAppId}
            />
        </div>
    );
};

export default Home;
