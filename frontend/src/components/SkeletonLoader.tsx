/**
 * SkeletonLoader Component
 * Provides visual feedback during data loading.
 * Single responsibility: render animated placeholder cards.
 */

interface SkeletonLoaderProps {
    /**
     * Number of skeleton cards to display
     * @default 24
     */
    count?: number;

    /** CSS class for custom styling */
    className?: string;
}

/** CSS for the skeleton loader — kept as a constant to avoid re-creating on every render. */
const SKELETON_STYLES = `
    .skeleton-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 1.5rem;
        animation: skeletonFadeIn 0.3s ease-in-out;
    }

    @keyframes skeletonFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .skeleton-card {
        position: relative;
        border-radius: var(--radius-lg);
        overflow: hidden;
        background: var(--color-bg-secondary);
    }

    .skeleton-image {
        width: 100%;
        height: 240px;
        background: linear-gradient(
            90deg,
            color-mix(in srgb, var(--color-bg-tertiary) 50%, transparent) 0%,
            color-mix(in srgb, var(--color-bg-tertiary) 80%, transparent) 50%,
            color-mix(in srgb, var(--color-bg-tertiary) 50%, transparent) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    .skeleton-content { padding: 0.75rem; }

    .skeleton-title {
        height: 0.75rem;
        background: linear-gradient(
            90deg,
            color-mix(in srgb, var(--color-bg-tertiary) 50%, transparent) 0%,
            color-mix(in srgb, var(--color-bg-tertiary) 80%, transparent) 50%,
            color-mix(in srgb, var(--color-bg-tertiary) 50%, transparent) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
        border-radius: var(--radius-sm);
        margin-bottom: 0.5rem;
    }

    .skeleton-title-short { width: 70%; }

    .skeleton-badge {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 3rem;
        height: 3rem;
        background: linear-gradient(
            90deg,
            color-mix(in srgb, var(--color-bg-tertiary) 50%, transparent) 0%,
            color-mix(in srgb, var(--color-bg-tertiary) 80%, transparent) 50%,
            color-mix(in srgb, var(--color-bg-tertiary) 50%, transparent) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
        border-radius: var(--radius-md);
    }

    @media (min-width: 768px) {
        .skeleton-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
        .skeleton-image { height: 270px; }
    }

    @media (max-width: 768px) {
        .skeleton-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.75rem; }
        .skeleton-image { height: 195px; }
        .skeleton-badge { width: 2.5rem; height: 2.5rem; top: 0.25rem; right: 0.25rem; }
    }
`;

/** Individual skeleton card — represents a loading placeholder for a manga card. */
function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image" />
            <div className="skeleton-content">
                <div className="skeleton-title" />
                <div className="skeleton-title skeleton-title-short" />
            </div>
            <div className="skeleton-badge" />
        </div>
    );
}

/** Displays a grid of skeleton cards to indicate loading state. */
export default function SkeletonLoader({
    count = 24,
    className = "",
}: SkeletonLoaderProps) {
    return (
        <div className={`skeleton-grid ${className}`}>
            <style>{SKELETON_STYLES}</style>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
}

export { SkeletonCard };
