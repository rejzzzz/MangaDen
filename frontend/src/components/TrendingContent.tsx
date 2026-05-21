import { useState } from "react";
import { api, type TrendingResult } from "../lib/api";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";

interface TrendingContentProps {
    initialData: TrendingResult | null;
    initialError: string | null;
}

/** CSS for TrendingContent — kept as a constant to avoid re-creating on every render. */
const TRENDING_STYLES = `
    .trending-container { width: 100%; }

    .trending-filter { margin-bottom: 2rem; }

    .filter-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }

    .filter-btn {
        padding: 0.75rem 1.5rem;
        border: 2px solid color-mix(in srgb, var(--color-text-primary) 20%, transparent);
        background: transparent;
        color: var(--color-text-secondary);
        border-radius: var(--radius-lg);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
        font-size: 0.95rem;
    }

    .filter-btn:hover:not(:disabled) {
        border-color: color-mix(in srgb, var(--color-text-primary) 40%, transparent);
        color: var(--color-text-primary);
    }

    .filter-btn.active {
        background: var(--gradient-primary);
        border-color: transparent;
        color: white;
    }

    .filter-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .trending-info {
        text-align: center;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: color-mix(in srgb, var(--color-bg-secondary) 50%, transparent);
        border-radius: var(--radius-lg);
    }

    .info-text {
        color: var(--color-text-secondary);
        font-size: 0.95rem;
    }

    .manga-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 1.5rem;
    }

    .manga-card-wrapper { position: relative; }

    .manga-link {
        display: block;
        text-decoration: none;
        color: inherit;
        border-radius: var(--radius-lg);
        overflow: hidden;
        transition: transform var(--transition-fast);
    }

    .manga-link:hover { transform: translateY(-4px); }

    .manga-cover {
        width: 100%;
        height: 240px;
        object-fit: cover;
        display: block;
    }

    .manga-info {
        padding: 0.75rem;
        background: var(--color-bg-secondary);
    }

    .manga-title {
        font-size: 0.9rem;
        font-weight: 600;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    .trending-badge {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
        color: white;
        padding: 0.5rem 0.75rem;
        border-radius: var(--radius-md);
        font-weight: 700;
        font-size: 0.75rem;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }

    .rank { font-size: 0.7rem; opacity: 0.9; }
    .score { font-size: 0.85rem; }

    @media (min-width: 768px) {
        .manga-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
        .manga-cover { height: 270px; }
    }

    @media (max-width: 768px) {
        .filter-buttons { gap: 0.5rem; }
        .filter-btn { padding: 0.5rem 1rem; font-size: 0.85rem; }
        .manga-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.75rem; }
        .manga-cover { height: 195px; }
        .trending-badge { top: 0.25rem; right: 0.25rem; padding: 0.4rem 0.6rem; }
        .trending-info { margin-bottom: 1rem; padding: 0.75rem; }
    }
`;

/**
 * TrendingContent — main container for the trending page.
 * Manages period filtering, data fetching, and rendering of manga cards.
 */
export default function TrendingContent({
    initialData,
    initialError,
}: TrendingContentProps) {
    const [trendingData, setTrendingData] = useState<TrendingResult | null>(
        initialData,
    );
    const [error, setError] = useState<string | null>(initialError);
    const [activePeriod, setActivePeriod] = useState<"1d" | "7d" | "30d">(
        "7d",
    );
    const [loading, setLoading] = useState(false);

    const periods: Array<{ value: "1d" | "7d" | "30d"; label: string }> = [
        { value: "1d", label: "Today" },
        { value: "7d", label: "This Week" },
        { value: "30d", label: "This Month" },
    ];

    /** Fetches trending data for the selected period. */
    const handlePeriodChange = async (period: "1d" | "7d" | "30d") => {
        setActivePeriod(period);
        setLoading(true);
        setError(null);

        try {
            const res = await api.getTrending({
                period,
                limit: 24,
                offset: 0,
            });

            if (res.success && res.data) {
                setTrendingData(res.data);
                setError(null);
            } else {
                setError(res.error || "Failed to load trending manga");
                setTrendingData(null);
            }
        } catch (err) {
            console.error("Failed to fetch trending:", err);
            setError("Failed to load trending manga. Please try again.");
            setTrendingData(null);
        } finally {
            setLoading(false);
        }
    };

    /** Retry handler — re-fetches the current period. */
    const handleRetry = () => {
        handlePeriodChange(activePeriod);
    };

    return (
        <div className="trending-container">
            <style>{TRENDING_STYLES}</style>

            {/* Filter Section */}
            <div className="trending-filter">
                <div className="filter-buttons">
                    {periods.map((period) => (
                        <button
                            key={period.value}
                            className={`filter-btn ${
                                activePeriod === period.value ? "active" : ""
                            }`}
                            onClick={() => handlePeriodChange(period.value)}
                            disabled={loading}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error State */}
            <ErrorState
                error={error}
                onRetry={handleRetry}
                showRetry={!loading}
            />

            {/* Loading State */}
            <LoadingState isLoading={loading} skeletonCount={24} />

            {/* Content Section */}
            {!loading && !error && trendingData && trendingData.manga.length > 0 ? (
                <>
                    <div className="trending-info">
                        <p className="info-text">
                            Showing{" "}
                            <strong>{trendingData.manga.length}</strong> of{" "}
                            <strong>{trendingData.total}</strong> trending manga
                        </p>
                    </div>
                    <div className="manga-grid">
                        {trendingData.manga.map((manga) => (
                            <div key={manga.id} className="manga-card-wrapper">
                                <a href={`/manga/${manga.slug}`} className="manga-link">
                                    <img
                                        src={
                                            manga.coverUrl ||
                                            "https://placehold.co/300x400/1a1a24/8b5cf6?text=No+Cover"
                                        }
                                        alt={manga.title}
                                        className="manga-cover"
                                    />
                                    <div className="manga-info">
                                        <h3 className="manga-title">{manga.title}</h3>
                                    </div>
                                </a>
                                <div className="trending-badge">
                                    <span className="rank">#{manga.rank}</span>
                                    <span className="score">
                                        {manga.score.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : !loading && !error ? (
                <EmptyState
                    title="No Trending Manga"
                    description="No trending manga found for this period. Try another time period."
                    icon="📚"
                />
            ) : null}
        </div>
    );
}
