import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    TrendingUp,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    Search,
    Filter,
    Download,
    Calendar,
    ChevronDown,
    Menu,
    X,
    Star,
    Shield,
    Zap,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import { processReviews } from './utils/dataProcessing';
import { AnalyzedData, Manifest } from './types';

// --- Types ---
// --- Types imported from ./types ---

// --- Dashboard Component (Refactored from original App) ---
const Dashboard: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const appId = searchParams.get('app') || 'com.nextbillion.groww';
    const version = searchParams.get('version');

    const [data, setData] = useState<AnalyzedData | null>(null);
    const [manifest, setManifest] = useState<Manifest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'reviews'>('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Get Manifest to find latest version if not provided
                let targetVersion = version;
                if (!targetVersion) {
                    const manifestRes = await fetch(`${import.meta.env.BASE_URL}manifest.json`);
                    if (!manifestRes.ok) throw new Error("Failed to load manifest");
                    if (!manifestRes.ok) throw new Error("Failed to load manifest");
                    const manifestData = await manifestRes.json();
                    setManifest(manifestData);

                    if (manifestData[appId]) {
                        targetVersion = manifestData[appId].latest;
                    } else {
                        // Fallback or error if app not found in manifest
                        // For now, try to find any app or default
                        const firstApp = Object.values(manifestData)[0] as any;
                        if (firstApp) targetVersion = firstApp.latest;
                        else throw new Error("App not found in history");
                    }
                }

                // 2. Fetch Data
                const dataPath = `${import.meta.env.BASE_URL}history/${appId}/${targetVersion}/reviews_analyzed_v2.json`;
                const res = await fetch(dataPath);
                if (!res.ok) throw new Error(`Failed to load data from ${dataPath}`);
                const text = await res.text();
                let jsonData;
                try {
                    jsonData = JSON.parse(text);
                } catch (e) {
                    console.error("JSON Parse Error. Raw text:", text.slice(0, 500));
                    throw new Error("Invalid JSON format in analysis file");
                }
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
                    <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Failed to Load Data</h2>
                    <p className="text-slate-600 mb-6">{error || "Data is missing or corrupt."}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // --- Render Dashboard Content (Same as before, just wrapped) ---
    // For brevity, I'm keeping the core logic but ensuring it uses the 'data' state.

    const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                {change && (
                    <span className={`flex items-center text-sm font-medium ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {Math.abs(change)}%
                    </span>
                )}
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
        </motion.div>
    );

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-bold tracking-tight leading-tight">
                                    {manifest && manifest[appId] ? manifest[appId].name : 'App Review Analytics'}
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

                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Analytics</div>
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                            { id: 'themes', icon: PieChart, label: 'Themes & Insights' },
                            { id: 'reviews', icon: MessageSquare, label: 'Reviews Explorer' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* History Section */}
                    {manifest && manifest[appId] && (
                        <div className="px-4 py-2 border-t border-slate-800">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">History</div>
                            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                {manifest[appId].versions.map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => {
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.set('version', v);
                                            setSearchParams(newParams);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex justify-between items-center ${version === v
                                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                                    >
                                        <span>{v.split('_')[0]}</span>
                                        <span className="opacity-50 text-[10px]">{v.split('_')[1]?.replace('reviews', '')} revs</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-4 border-t border-slate-800">
                        <div className="bg-slate-800 rounded-xl p-4">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
                                    GD
                                </div>
                                <div>
                                    <div className="font-medium text-sm">Growth Team</div>
                                    <div className="text-xs text-slate-400">View Only</div>
                                </div>
                            </div>
                            <div className="text-xs text-slate-500 text-center">
                                v2.4.0 • Updated {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>
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
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">
                            <Zap size={14} className="mr-1.5" />
                            Live Analysis
                        </div>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative">
                            <AlertCircle size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-8"
                            >
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard
                                        title="Total Reviews"
                                        value={data.metadata.total_reviews}
                                        change={12}
                                        icon={MessageSquare}
                                        color="bg-blue-500"
                                    />
                                    <StatCard
                                        title="Average Rating"
                                        value={data.metadata.average_rating.toFixed(1)}
                                        change={-2.5}
                                        icon={Star}
                                        color="bg-yellow-500"
                                    />
                                    <StatCard
                                        title="Sentiment Score"
                                        value={`${(data.sentiment_distribution.Positive / data.metadata.total_reviews * 100).toFixed(0)}%`}
                                        change={5.2}
                                        icon={TrendingUp}
                                        color="bg-emerald-500"
                                    />
                                    <StatCard
                                        title="Critical Issues"
                                        value={data.reviews.filter(r => r.sentiment === 'Negative').length}
                                        change={-8}
                                        icon={AlertCircle}
                                        color="bg-rose-500"
                                    />
                                </div>

                                {/* Top Themes */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <h3 className="text-lg font-bold text-slate-800 mb-6">Dominant Themes</h3>
                                        <div className="space-y-6">
                                            {data.themes.slice(0, 5).map((theme, idx) => (
                                                <div key={idx} className="group">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center">
                                                            <span className="font-medium text-slate-700">{theme.theme}</span>
                                                            <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${theme.sentiment_score > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                                }`}>
                                                                {theme.sentiment_score > 0 ? 'Positive' : 'Negative'}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-slate-500">{theme.volume} reviews</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${theme.sentiment_score > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${(theme.volume / data.metadata.total_reviews) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sentiment Distribution */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <h3 className="text-lg font-bold text-slate-800 mb-6">Sentiment Split</h3>
                                        <div className="flex items-center justify-center h-64">
                                            {/* Placeholder for Chart */}
                                            <div className="text-center space-y-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                                    <span className="text-sm text-slate-600">Positive: {data.sentiment_distribution.Positive}</span>
                                                </div>
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                                                    <span className="text-sm text-slate-600">Neutral: {data.sentiment_distribution.Neutral}</span>
                                                </div>
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                                                    <span className="text-sm text-slate-600">Negative: {data.sentiment_distribution.Negative}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* THEMES TAB */}
                        {activeTab === 'themes' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {data.themes.map((theme, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-bold text-slate-800">{theme.theme}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme.sentiment_score > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                Score: {theme.sentiment_score.toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">{theme.summary}</p>

                                        <div className="mb-4">
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Keywords</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {theme.keywords.map((kw, k) => (
                                                    <span key={k} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md border border-slate-200">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">User Voice</h4>
                                            <p className="text-sm text-slate-700 italic">"{theme.examples[0]}"</p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* REVIEWS TAB */}
                        {activeTab === 'reviews' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                {data.reviews.map((review) => (
                                    <div key={review.reviewId} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${review.sentiment === 'Positive' ? 'bg-emerald-500' :
                                                    review.sentiment === 'Negative' ? 'bg-rose-500' : 'bg-slate-400'
                                                    }`}>
                                                    {review.score}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800">{review.userName}</div>
                                                    <div className="text-xs text-slate-500">{new Date(review.at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                {review.themes.map((t, i) => (
                                                    <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-slate-700 text-sm leading-relaxed mb-4">{review.content}</p>
                                        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                                            <div className="flex space-x-4">
                                                <span className="flex items-center"><ThumbsUp size={14} className="mr-1" /> {review.thumbsUpCount}</span>
                                                <span className="flex items-center">v{review.appVersion || 'Unknown'}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">Intent:</span>
                                                <span className="capitalize">{review.intent}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
};

// --- Main App Component ---
const App: React.FC = () => {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;