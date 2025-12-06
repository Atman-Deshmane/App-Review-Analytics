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
    const [userEmail, setUserEmail] = useState('');

    // Loading State
    const [jobStatus, setJobStatus] = useState<JobStatus>({ status: 'Initializing...', progress: 0, last_update: '' });
    const [logs, setLogs] = useState<string[]>([]);
    const [debugError, setDebugError] = useState<string | null>(null);

    useEffect(() => {
        // Load Manifest with Cache Busting
        fetch(`${import.meta.env.BASE_URL}manifest.json?t=${Date.now()}`)
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
        setUserEmail(config.email);
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

                        // Construct target URL
                        // const today = new Date().toISOString().split('T')[0]; // Already defined above
                        // const version = `${today}_${config.count}reviews`; // Already defined above

                        // Redirect after delay
                        setTimeout(() => {
                            // Force hard redirect to ensure assets reload
                            window.location.href = `/reviews/dashboard?app=${targetAppId}&version=${version}`;
                        }, 15000); // 15s Delay for Deployment
                    }, 2000); // 2s delay for "Preparing dashboard..." message

                    // Unsubscribe after completion
                    if (unsubscribe) unsubscribe();
                }
            });

        } catch (error: any) {
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
                email={userEmail}
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
                            <div className="max-h-80 overflow-y-auto p-2">
                                {filteredHistory.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {filteredHistory.map(([id, app]) => (
                                            <button
                                                key={id}
                                                onClick={() => navigate(`/dashboard?app=${id}&version=${app.latest}`)}
                                                className="p-3 text-left bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all group flex items-start space-x-3"
                                            >
                                                {/* App Icon */}
                                                <div className="flex-shrink-0">
                                                    {app.icon ? (
                                                        <img
                                                            src={app.icon}
                                                            alt={app.name}
                                                            className="w-12 h-12 rounded-xl shadow-sm bg-slate-100 object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${app.name}&background=random`
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                                            {app.name.substring(0, 1).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-slate-900 truncate pr-4">
                                                        {app.name || id}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 truncate font-mono mt-0.5 mb-1">
                                                        {id}
                                                    </div>
                                                    <div className="flex items-center text-emerald-600 text-xs font-medium">
                                                        <Star size={12} className="mr-1 fill-current" />
                                                        Ready Instantly
                                                    </div>

                                                    {/* Hover Action */}
                                                    <div className="mt-2 flex items-center text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0">
                                                        <span>View Analysis</span>
                                                        <ArrowRight size={12} className="ml-1" />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-sm">
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
