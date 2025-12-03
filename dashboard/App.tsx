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
    const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
    const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Get Manifest to find latest version if not provided
                // 1. Fetch Manifest (Always needed for sidebar history)
                const manifestRes = await fetch(`${import.meta.env.BASE_URL}manifest.json`);
                if (!manifestRes.ok) throw new Error("Failed to load manifest");
                const manifestData = await manifestRes.json();
                setManifest(manifestData);

                // 2. Determine Target Version
                let targetVersion = version;
                if (!targetVersion) {
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
                                    {manifest && manifest[appId]
                                        ? manifest[appId].name
                                        : (appId ? appId.split('.').pop()?.charAt(0).toUpperCase()! + appId.split('.').pop()?.slice(1) : 'App Review Analytics')}
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
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                                History: {manifest[appId].name}
                            </div>
                            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                {manifest[appId].versions.map((v) => {
                                    const [date, countStr] = v.split('_');
                                    const count = countStr ? countStr.replace('reviews', '') : '0';
                                    const formattedDate = new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                                    return (
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
                                            <span>{formattedDate}</span>
                                            <span className="opacity-50 text-[10px]">{count} revs</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="p-4 border-t border-slate-800 mt-auto">
                        <button
                            onClick={() => window.location.href = import.meta.env.BASE_URL}
                            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition-colors text-sm font-medium mb-4"
                        >
                            <Search size={16} />
                            <span>Switch App</span>
                        </button>

                        <div className="bg-slate-800/50 rounded-xl p-4">
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
                    <div className="flex items-center space-x-8">
                        <div className="hidden md:block text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Source</div>
                            <div className="text-sm font-bold text-slate-800">
                                {new Date(data.metadata.date_range.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(data.metadata.date_range.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                        <div className="hidden md:block text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</div>
                            <div className="text-sm font-bold text-slate-800 flex items-center justify-end">
                                <ThumbsUp size={14} className="mr-1 text-slate-400" />
                                {data.metadata.totalLikes.toLocaleString()} Likes
                            </div>
                        </div>
                        <div className="hidden md:block text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reviews</div>
                            <div className="text-sm font-bold text-slate-800 flex items-center justify-end">
                                <MessageSquare size={14} className="mr-1 text-slate-400" />
                                {data.metadata.total_reviews.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </header>

                <div className={`flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ${selectedCluster ? 'filter blur-sm pointer-events-none' : ''}`}>
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
                                                    <span className="text-sm text-slate-600">Positive: {data.sentiment_likes_distribution.Positive.toLocaleString()} likes</span>
                                                </div>
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                                                    <span className="text-sm text-slate-600">Neutral: {data.sentiment_likes_distribution.Neutral.toLocaleString()} likes</span>
                                                </div>
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                                                    <span className="text-sm text-slate-600">Negative: {data.sentiment_likes_distribution.Negative.toLocaleString()} likes</span>
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
                                className="space-y-8"
                            >
                                {/* Strategic Themes Cards */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Strategic Themes</h3>
                                    <div className="flex overflow-x-auto pb-4 gap-4 snap-x md:grid md:grid-cols-2 lg:grid-cols-5 md:overflow-visible no-scrollbar">
                                        {data.themes.slice(0, 5).map((theme, idx) => {
                                            const total = theme.positiveCount + theme.negativeCount;
                                            const positivePct = total > 0 ? Math.round((theme.positiveCount / total) * 100) : 0;
                                            const impactScore = theme.totalLikes;

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedThemeIndex(idx)}
                                                    className={`text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden min-w-[260px] md:min-w-0 snap-center ${selectedThemeIndex === idx
                                                        ? 'bg-white border-slate-800 shadow-md'
                                                        : 'bg-white border-slate-100 hover:border-slate-300'
                                                        }`}
                                                >
                                                    {selectedThemeIndex === idx && (
                                                        <motion.div
                                                            layoutId="active-border"
                                                            className="absolute top-0 left-0 w-full h-1 bg-slate-800"
                                                        />
                                                    )}
                                                    <div className="mb-3">
                                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 truncate">{theme.theme}</div>
                                                        <div className="flex items-baseline space-x-2">
                                                            <span className="text-2xl font-bold text-slate-800">{impactScore.toLocaleString()}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">IMPACT SCORE</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] font-medium text-slate-400 uppercase">
                                                            <span>Sentiment Split</span>
                                                            <span>{positivePct}% Positive</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                                            <div
                                                                className="h-full bg-emerald-500"
                                                                style={{ width: `${positivePct}%` }}
                                                            ></div>
                                                            <div
                                                                className="h-full bg-rose-500"
                                                                style={{ width: `${100 - positivePct}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Sentiment Clusters */}
                                <div className="bg-white p-8 rounded-2xl border border-slate-100 min-h-[500px] relative">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-lg font-bold text-slate-800">
                                            Sentiment Clusters: <span className="text-slate-500 font-normal">{data.themes[selectedThemeIndex]?.theme}</span>
                                        </h3>
                                        <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
                                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                            <span>Negative</span>
                                            <div className="w-16 h-1 bg-gradient-to-r from-rose-500 via-slate-300 to-emerald-500 rounded-full mx-2"></div>
                                            <span>Positive</span>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center gap-6 py-12">
                                        {data.themes[selectedThemeIndex]?.clusters.map((cluster, idx) => {
                                            // Dynamic sizing based on volume relative to theme volume
                                            const themeVolume = data.themes[selectedThemeIndex].volume;
                                            const size = Math.max(80, Math.min(200, (cluster.volume / themeVolume) * 500));

                                            // Color based on sentiment (-1 to 1)
                                            // Map -1 -> Rose, 0 -> Slate, 1 -> Emerald
                                            const totalSent = cluster.positiveCount + cluster.negativeCount;
                                            const negPct = totalSent === 0 ? 0 : (cluster.negativeCount / totalSent) * 100;

                                            // Smoother Gradient Logic
                                            const transitionZone = 20;
                                            const stop1 = Math.max(0, negPct - transitionZone);
                                            const stop2 = Math.min(100, negPct + transitionZone);

                                            const gradient = `linear-gradient(135deg, #e11d48 ${stop1}%, #059669 ${stop2}%)`;

                                            return (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 100, delay: idx * 0.05 }}
                                                    onClick={() => setSelectedCluster(cluster.name)}
                                                    className={`rounded-full flex flex-col items-center justify-center text-white shadow-lg relative cursor-pointer hover:scale-105 transition-transform border-2 border-white ring-1 ring-slate-100/50`}
                                                    style={{
                                                        width: size,
                                                        height: size,
                                                        background: gradient
                                                    }}
                                                >
                                                    <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors duration-300 rounded-full" />
                                                    <div className="text-center px-2 relative z-10">
                                                        <div className="font-bold text-sm leading-tight mb-1 line-clamp-2 drop-shadow-md">
                                                            {cluster.name}
                                                        </div>
                                                        <div className="text-xs opacity-90 font-mono bg-black/20 px-2 py-0.5 rounded-full inline-block backdrop-blur-sm">
                                                            {cluster.totalLikes.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        {data.themes[selectedThemeIndex]?.clusters.length === 0 && (
                                            <div className="text-slate-400 text-center">
                                                No detailed clusters available for this theme.
                                            </div>
                                        )}
                                    </div>
                                </div>
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
            {/* Topic Inspector Side Panel */}
            <AnimatePresence>
                {
                    selectedCluster && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Topic Inspector</div>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedCluster}</h3>
                                    <div className="flex items-center space-x-4 mt-2 text-xs font-medium text-slate-500">
                                        <span className="flex items-center"><ThumbsUp size={12} className="mr-1" /> {data?.themes[selectedThemeIndex].clusters.find(c => c.name === selectedCluster)?.volume} Impact</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCluster(null)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">User Verbatim</div>
                                <div className="space-y-4">
                                    {data?.reviews
                                        .filter(r => r.themes.includes(data.themes[selectedThemeIndex].theme) && (r.intent === selectedCluster || r.category === selectedCluster || selectedCluster === 'Other')) // Match theme and cluster (tag)
                                        .slice(0, 20) // Limit to 20 for performance
                                        .map((review) => (
                                            <div key={review.reviewId} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${review.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-700' :
                                                        review.sentiment === 'Negative' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {review.sentiment}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">{new Date(review.at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-slate-700 text-xs leading-relaxed mb-3">{review.content}</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={10} fill={i < review.score ? "currentColor" : "none"} className={i < review.score ? "" : "text-slate-200"} />
                                                        ))}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 flex items-center">
                                                        +{review.thumbsUpCount} likes
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
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