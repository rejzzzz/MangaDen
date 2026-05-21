/**
 * LoadingState Component
 * Manages different loading states with appropriate UI feedback.
 * Single responsibility: render a skeleton loader when data is loading.
 */

import SkeletonLoader from "./SkeletonLoader";

interface LoadingStateProps {
    /** Whether data is currently loading */
    isLoading: boolean;

    /**
     * Number of skeleton items to show
     * @default 24
     */
    skeletonCount?: number;

    /**
     * Custom loading message
     * @default "Loading trending manga..."
     */
    loadingMessage?: string;

    /** CSS class for custom styling */
    className?: string;
}

/**
 * Displays a skeleton loader during loading state.
 * Returns null when not loading to keep the DOM clean.
 */
export default function LoadingState({
    isLoading,
    skeletonCount = 24,
    loadingMessage = "Loading trending manga...",
    className = "",
}: LoadingStateProps) {
    if (!isLoading) {
        return null;
    }

    return (
        <div className={`loading-state ${className}`}>
            <style>{`
                .loading-state {
                    width: 100%;
                    animation: loadingFadeIn 0.3s ease-in-out;
                }

                @keyframes loadingFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .loading-header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    background: color-mix(
                        in srgb,
                        var(--color-bg-secondary) 50%,
                        transparent
                    );
                    border-radius: var(--radius-lg);
                }

                .loading-message {
                    color: var(--color-text-secondary);
                    font-size: 0.95rem;
                    margin: 0;
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    .loading-header {
                        margin-bottom: 1rem;
                        padding: 0.75rem;
                    }
                    .loading-message {
                        font-size: 0.85rem;
                    }
                }
            `}</style>
            <div className="loading-header">
                <p className="loading-message">{loadingMessage}</p>
            </div>
            <SkeletonLoader count={skeletonCount} />
        </div>
    );
}
