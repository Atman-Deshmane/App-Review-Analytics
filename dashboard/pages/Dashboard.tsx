import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    TrendingUp,
    AlertCircle,
    ThumbsUp,
    Star,
    Shield,
    PieChart,
    Search,
    Menu,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { StatCard } from '../components/StatCard';
import { ThemeCard } from '../components/ThemeCard';
import { BubbleViz } from '../components/BubbleViz';
import { ReviewDrawer } from '../components/ReviewDrawer';
// import { TerminalLoader } from '../components/TerminalLoader'; // TODO: Integrate loader if relevant

// Utils & Types
import { processReviews } from '../utils/dataProcessing';
import { AnalyzedData, Manifest, TagMetric } from '../types';

const Dashboard: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const appId = searchParams.get('app') || 'com.nextbillion.groww';
    const version = searchParams.get('version');

    const [data, setData] = useState<AnalyzedData | null>(null);
    const [manifest, setManifest] = useState<Manifest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'reviews'>('themes'); // Default to themes as requested "Bubbles are back!"
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
    const [selectedTag, setSelectedTag] = useState<TagMetric | null>(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch Manifest
                const manifestRes = await fetch('/reviews/manifest.json?t=' + Date.now());
                if (!manifestRes.ok) throw new Error("Failed to load manifest");
                const manifestData = await manifestRes.json();
                setManifest(manifestData);

                // 2. Determine Target Version
                let targetVersion = version;
                if (!targetVersion) {
                    if (manifestData[appId]) {
                        targetVersion = manifestData[appId].latest;
                    } else {
                        const firstApp = Object.values(manifestData)[0] as any;
                        if (firstApp) targetVersion = firstApp.latest;
                        else throw new Error("App not found in history");
                    }
                }

                // 3. Fetch Data
                const dataPath = `/reviews/history/${appId}/${targetVersion}/reviews_analyzed_v2.json`;
                const res = await fetch(`${dataPath}?t=${Date.now()}`);
                if (!res.ok) throw new Error(`Failed to load data from ${dataPath}`);
                const text = await res.text();
                const jsonData = JSON.parse(text);
                const processedData = processReviews(jsonData, appId);
                setData(processedData);
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [appId, version]);

    // Loading State
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading Analysis...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
                    <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Unavailable</h2>
                    <p className="text-slate-600 mb-6">{error || "Data could not be loaded."}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col`}>
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg overflow-hidden">
                            {manifest && manifest[appId]?.icon ? (
                                <img src={manifest[appId].icon} alt="App" className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div>
                            <div className="text-sm font-bold tracking-tight leading-tight">
                                {manifest && manifest[appId] ? manifest[appId].name : 'App Analytics'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                Review Analytics
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-indigo-900/20 shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <LayoutDashboard size={20} className={activeTab === 'overview' ? 'text-indigo-200' : 'text-slate-500 group-hover:text-white'} />
                        <span className="font-medium">Overview</span>
                    </button>
                    <button onClick={() => setActiveTab('themes')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'themes' ? 'bg-indigo-600 text-white shadow-indigo-900/20 shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <PieChart size={20} className={activeTab === 'themes' ? 'text-indigo-200' : 'text-slate-500 group-hover:text-white'} />
                        <span className="font-medium">Themes & Insights</span>
                    </button>
                    <button onClick={() => setActiveTab('reviews')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'reviews' ? 'bg-indigo-600 text-white shadow-indigo-900/20 shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <MessageSquare size={20} className={activeTab === 'reviews' ? 'text-indigo-200' : 'text-slate-500 group-hover:text-white'} />
                        <span className="font-medium">All Reviews</span>
                    </button>
                </nav>

                {/* History */}
                {manifest && manifest[appId] && (
                    <div className="px-4 py-2 border-t border-slate-800">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">History</div>
                        <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                            {manifest[appId].versions.map((v) => {
                                const [date, countStr] = v.split('_');
                                const count = countStr ? countStr.replace('reviews', '') : '0';
                                return (
                                    <button
                                        key={v}
                                        onClick={() => {
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.set('version', v);
                                            setSearchParams(newParams);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex justify-between items-center ${version === v ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                                    >
                                        <span>{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        <span className="opacity-50 text-[10px]">{count} revs</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="p-4 border-t border-slate-800 mt-auto">
                    <button onClick={() => window.location.href = '/'} className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all mb-4">
                        <Search size={16} />
                        <span>Switch App</span>
                    </button>
                    <div className="text-xs text-slate-500 text-center">v2.5.0 • Updated {new Date().toLocaleDateString()}</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-8">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4 text-slate-500 hover:text-slate-700">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-semibold text-slate-800">
                            {activeTab === 'overview' && 'Dashboard Overview'}
                            {activeTab === 'themes' && 'Theme Analysis'}
                            {activeTab === 'reviews' && 'Review Explorer'}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="hidden md:block text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Likes</div>
                            <div className="text-sm font-bold text-slate-800 flex items-center justify-end">
                                <ThumbsUp size={14} className="mr-1 text-slate-400" />
                                {data.metadata.totalLikes.toLocaleString()}
                            </div>
                        </div>
                        <div className="hidden md:block text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</div>
                            <div className="text-sm font-bold text-slate-800 flex items-center justify-end">
                                <MessageSquare size={14} className="mr-1 text-slate-400" />
                                {data.metadata.total_reviews.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* THEMES TAB (Default) */}
                        {activeTab === 'themes' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 flex flex-col h-full">
                                {/* Theme Cards (Horizontal Scroll) */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Strategic Themes</h3>
                                    <div className="flex overflow-x-auto pb-4 gap-4 snap-x md:grid md:grid-cols-2 lg:grid-cols-5 md:overflow-visible no-scrollbar">
                                        {data.themes.slice(0, 5).map((theme, idx) => (
                                            <ThemeCard
                                                key={idx}
                                                theme={theme}
                                                isSelected={selectedThemeIndex === idx}
                                                onClick={() => setSelectedThemeIndex(idx)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Bubble Viz */}
                                <div className="flex-1 min-h-[500px] relative">
                                    <div className="absolute inset-0">
                                        <BubbleViz
                                            theme={data.themes[selectedThemeIndex]}
                                            onTagSelect={setSelectedTag}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard
                                        title="Total Reviews"
                                        value={data.metadata.total_reviews.toLocaleString()}
                                        icon={MessageSquare}
                                        color="bg-blue-500"
                                    />
                                    <StatCard
                                        title="Average Rating"
                                        value={data.metadata.average_rating.toFixed(1)}
                                        icon={Star}
                                        color="bg-yellow-500"
                                    />
                                    <StatCard
                                        title="Positive Sentiment"
                                        value={`${(data.sentiment_distribution.Positive / data.metadata.total_reviews * 100).toFixed(0)}%`}
                                        icon={TrendingUp}
                                        color="bg-emerald-500"
                                    />
                                    <StatCard
                                        title="Critical Issues"
                                        value={data.reviews.filter(r => r.sentiment === 'Negative').length.toLocaleString()}
                                        icon={AlertCircle}
                                        color="bg-rose-500"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* REVIEWS TAB */}
                        {activeTab === 'reviews' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                {data.reviews.slice(0, 100).map((review) => (
                                    <div key={review.reviewId} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${review.sentiment === 'Positive' ? 'bg-emerald-500' :
                                                    review.sentiment === 'Negative' ? 'bg-rose-500' : 'bg-slate-400'
                                                    }`}>
                                                    {review.score}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800">{review.userName || 'User'}</div>
                                                    <div className="text-xs text-slate-500">{new Date(review.at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-slate-700 text-sm leading-relaxed mb-4">{review.content}</p>
                                        <div className="flex items-center text-xs text-slate-500 border-t border-slate-100 pt-3">
                                            <ThumbsUp size={14} className="mr-1" /> {review.thumbsUpCount} Like(s)
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                    </div>
                </div>
            </main>

            {/* Drawers/Modals */}
            <ReviewDrawer
                tag={selectedTag}
                onClose={() => setSelectedTag(null)}
            />
        </div>
    );
};

export default Dashboard;
