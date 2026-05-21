/**
 * ErrorState Component
 * Displays error messages with retry capability.
 * Single responsibility: render error UI with optional retry action.
 */

interface ErrorStateProps {
    /** Error message to display */
    error: string | null;

    /** Callback function when retry button is clicked */
    onRetry?: () => void;

    /**
     * Whether retry button should be shown
     * @default true
     */
    showRetry?: boolean;

    /** CSS class for custom styling */
    className?: string;
}

/** CSS for error state — kept as a constant to avoid re-creating on every render. */
const ERROR_STYLES = `
    .error-state {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        text-align: center;
        animation: errorSlideDown 0.3s ease-out;
    }

    @keyframes errorSlideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .error-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .error-icon { font-size: 2rem; flex-shrink: 0; }
    .error-message-wrapper { text-align: left; }

    .error-title {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-primary);
    }

    .error-message {
        margin: 0;
        font-size: 0.9rem;
        color: var(--color-text-secondary);
    }

    .retry-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .retry-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .retry-button:active { transform: translateY(0); }

    .retry-icon {
        display: inline-block;
        transition: transform var(--transition-fast);
    }

    .retry-button:hover .retry-icon { transform: rotate(180deg); }

    @media (max-width: 768px) {
        .error-state { padding: 1rem; }
        .error-content { gap: 0.75rem; margin-bottom: 0.75rem; }
        .error-icon { font-size: 1.5rem; }
        .error-title { font-size: 0.95rem; }
        .error-message { font-size: 0.85rem; }
        .retry-button { padding: 0.6rem 1.2rem; font-size: 0.85rem; }
    }
`;

/**
 * Displays error message with optional retry button.
 * Returns null when there is no error.
 */
export default function ErrorState({
    error,
    onRetry,
    showRetry = true,
    className = "",
}: ErrorStateProps) {
    if (!error) {
        return null;
    }

    return (
        <div className={`error-state ${className}`}>
            <style>{ERROR_STYLES}</style>
            <div className="error-content">
                <div className="error-icon">⚠️</div>
                <div className="error-message-wrapper">
                    <h3 className="error-title">Failed to Load</h3>
                    <p className="error-message">{error}</p>
                </div>
            </div>
            {showRetry && onRetry && (
                <button className="retry-button" onClick={onRetry}>
                    <span className="retry-icon">↻</span>
                    Try Again
                </button>
            )}
        </div>
    );
}
