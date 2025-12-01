import React, { useState, useEffect, useMemo } from 'react';
import { processReviews } from './utils/dataProcessing';
import { ThemeMetric, TagMetric, Review } from './types';
import { ThemeCard } from './components/ThemeCard';
import { BubbleViz } from './components/BubbleViz';
import { ReviewDrawer } from './components/ReviewDrawer';
import { TrendingUp, Users, MessageSquare, Menu, Loader2, AlertCircle } from 'lucide-react';

export default function App() {
    const [themes, setThemes] = useState<ThemeMetric[]>([]);
    const [selectedThemeName, setSelectedThemeName] = useState<string | null>(null);
    const [selectedTag, setSelectedTag] = useState<TagMetric | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch the JSON file from the root (public folder in standard React apps, or relative path)
                // Assuming the build process places reviews_analyzed_v2.json accessible at root
                const response = await fetch('/reviews_analyzed_v2.json');

                if (!response.ok) {
                    throw new Error(`Failed to load data: ${response.statusText}`);
                }

                const data: Review[] = await response.json();
                setReviews(data);

                const processedThemes = processReviews(data);
                setThemes(processedThemes);

                if (processedThemes.length > 0) {
                    setSelectedThemeName(processedThemes[0].name);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const currentTheme = useMemo(() => {
        return themes.find(t => t.name === selectedThemeName);
    }, [themes, selectedThemeName]);

    const totalReviews = reviews.length;
    const totalLikes = reviews.reduce((acc, curr) => acc + (curr.thumbs_up_count || 0), 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                <span>Loading Analytics Data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-rose-500">
                <AlertCircle className="w-8 h-8 mr-2" />
                <span>Error: {error}. Please ensure 'reviews_analyzed_v2.json' is present.</span>
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

                    {/* Desktop Stats */}
                    <div className="hidden md:flex items-center space-x-6 text-sm">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Data Source</span>
                            <span className="font-semibold text-slate-700">Live Analysis V2</span>
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

                    {/* Mobile Menu Placeholder (Visual Only for now) */}
                    <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
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