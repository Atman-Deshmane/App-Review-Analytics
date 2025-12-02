import React, { useState, useEffect, useMemo } from 'react';
import { processReviews } from './utils/dataProcessing';
import { ThemeMetric, TagMetric, Review } from './types';
import { ThemeCard } from './components/ThemeCard';
import { BubbleViz } from './components/BubbleViz';
import { ReviewDrawer } from './components/ReviewDrawer';
import { TrendingUp, Users, MessageSquare, Menu, Loader2, AlertCircle, Calendar } from 'lucide-react';

export default function App() {
    const [themes, setThemes] = useState<ThemeMetric[]>([]);
    const [selectedThemeName, setSelectedThemeName] = useState<string | null>(null);
    const [selectedTag, setSelectedTag] = useState<TagMetric | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Versioning State
    const [availableVersions, setAvailableVersions] = useState<string[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

    // 1. Fetch Manifest on Mount
    useEffect(() => {
        const fetchManifest = async () => {
            try {
                // Use BASE_URL to handle subdirectory hosting (e.g. /reviews/)
                const baseUrl = import.meta.env.BASE_URL;
                // Remove trailing slash if present to avoid double slashes
                const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

                const response = await fetch(`${cleanBaseUrl}/manifest.json`);
                if (!response.ok) throw new Error('Failed to load version manifest');

                const versions: string[] = await response.json();
                setAvailableVersions(versions);

                if (versions.length > 0) {
                    // Default to the latest version (first in list)
                    setSelectedVersion(versions[0]);
                } else {
                    throw new Error('No analysis versions found in manifest');
                }
            } catch (err) {
                console.error("Error fetching manifest:", err);
                setError(err instanceof Error ? err.message : 'Failed to load manifest');
                setLoading(false);
            }
        };
        fetchManifest();
    }, []);

    // 2. Fetch Data when Version Changes
    useEffect(() => {
        if (!selectedVersion) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Use BASE_URL for data fetching as well
                const baseUrl = import.meta.env.BASE_URL;
                const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

                // Construct path based on version
                // e.g., /reviews/history/2025-12-01_v2/reviews_analyzed_v2.json
                const dataPath = `${cleanBaseUrl}/history/${selectedVersion}/reviews_analyzed_v2.json`;
                console.log(`Fetching data from: ${dataPath}`);

                const response = await fetch(dataPath);

                if (!response.ok) {
                    throw new Error(`Failed to load data for version ${selectedVersion}`);
                }

                const data: Review[] = await response.json();
                setReviews(data);

                const processedThemes = processReviews(data);
                setThemes(processedThemes);

                // Reset selections when data changes
                if (processedThemes.length > 0) {
                    setSelectedThemeName(processedThemes[0].name);
                }
                setSelectedTag(null);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedVersion]);

    const currentTheme = useMemo(() => {
        return themes.find(t => t.name === selectedThemeName);
    }, [themes, selectedThemeName]);

    const totalReviews = reviews.length;
    const totalLikes = reviews.reduce((acc, curr) => acc + (curr.thumbs_up_count || 0), 0);

    if (loading && !selectedVersion) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                <span>Initializing Dashboard...</span>
            </div>
        );
    }

    if (error && !reviews.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-rose-500">
                <AlertCircle className="w-8 h-8 mr-2" />
                <span>Error: {error}</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 pb-10">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm md:shadow-none">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center shadow-sm">
                            <TrendingUp className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-800 tracking-tight">CX SENTINEL</h1>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider hidden sm:block">Boardroom Analytics</p>
                        </div>
                    </div>

                    {/* Desktop Stats & Version Selector */}
                    <div className="hidden md:flex items-center space-x-6 text-sm">

                        {/* Version Selector */}
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Report Version</span>
                            <div className="relative group">
                                <select
                                    value={selectedVersion || ''}
                                    onChange={(e) => setSelectedVersion(e.target.value)}
                                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-1 pl-2 pr-6 rounded cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
                                    disabled={loading}
                                >
                                    {availableVersions.map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                                <Calendar className="w-3 h-3 text-slate-400 absolute right-2 top-1.5 pointer-events-none" />
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200"></div>

                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Volume</span>
                            <span className="font-semibold text-slate-700 flex items-center">
                                <Users className="w-3 h-3 mr-1 text-slate-400" />
                                {totalLikes.toLocaleString()} Likes
                            </span>
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Records</span>
                            <span className="font-semibold text-slate-700 flex items-center">
                                <MessageSquare className="w-3 h-3 mr-1 text-slate-400" />
                                {totalReviews.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Mobile Menu Placeholder */}
                    <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {/* Loading Bar */}
                {loading && (
                    <div className="h-0.5 w-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-slate-900 animate-progress origin-left"></div>
                    </div>
                )}
            </header>

            {/* Main Layout */}
            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">

                {/* Section A: KPI Columns (Themes) */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Strategic Themes</h2>
                        <span className="text-[10px] md:text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Ranked by Impact</span>
                    </div>

                    {/* Mobile: Horizontal Scroll, Desktop: Grid */}
                    <div className="flex overflow-x-auto pb-4 gap-4 snap-x md:grid md:grid-cols-2 lg:grid-cols-5 md:overflow-visible no-scrollbar">
                        {themes.map((theme) => (
                            <ThemeCard
                                key={theme.name}
                                theme={theme}
                                isSelected={selectedThemeName === theme.name}
                                onClick={() => setSelectedThemeName(theme.name)}
                            />
                        ))}
                    </div>
                </section>

                {/* Section B: Data Visualization (Sentiment Map) */}
                <section className="h-[500px] md:h-[600px] flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                        <h2 className="text-lg font-semibold text-slate-800 truncate">
                            Sentiment Clusters: <span className="text-slate-500 font-normal">{selectedThemeName}</span>
                        </h2>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-1.5 rounded-full border border-slate-100 shadow-sm md:shadow-none md:border-none md:bg-transparent">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            <span className="hidden sm:inline">Negative</span>
                            <span className="w-12 h-1 bg-gradient-to-r from-rose-500 via-slate-200 to-emerald-500 rounded-full mx-1"></span>
                            <span className="hidden sm:inline">Positive</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        </div>
                    </div>

                    <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-1 overflow-hidden relative">
                        {currentTheme ? (
                            <BubbleViz theme={currentTheme} onTagSelect={setSelectedTag} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                Select a theme to view sentiment clusters
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Review Inspector Drawer */}
            <ReviewDrawer
                tag={selectedTag}
                onClose={() => setSelectedTag(null)}
            />
        </div>
    );
}