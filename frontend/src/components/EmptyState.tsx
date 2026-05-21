/**
 * EmptyState Component
 * Displays when no data is available
 * Follows OOPS principles with single responsibility
 */

interface EmptyStateProps {
    /**
     * Title text to display
     * @default "No Results"
     */
    title?: string;

    /**
     * Description text to display
     * @default "No trending manga found."
     */
    description?: string;

    /**
     * Icon emoji or text
     * @default "📭"
     */
    icon?: string;

    /**
     * CSS class for custom styling
     */
    className?: string;
}

/**
 * EmptyState Component
 * Displays a friendly message when no data is available
 * Provides better UX than blank space
 */
export default function EmptyState({
    title = "No Results",
    description = "No trending manga found.",
    icon = "📭",
    className = "",
}: EmptyStateProps) {
    return (
        <div className={`empty-state ${className}`}>
            <div className="empty-icon">{icon}</div>
            <h3 className="empty-title">{title}</h3>
            <p className="empty-description">{description}</p>

            <style>{`
                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: var(--color-text-muted);
                    animation: fadeIn 0.3s ease-in-out;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    display: block;
                }

                .empty-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                    color: var(--color-text-secondary);
                }

                .empty-description {
                    font-size: 0.95rem;
                    margin: 0;
                    color: var(--color-text-muted);
                }

                @media (max-width: 768px) {
                    .empty-state {
                        padding: 2rem 1rem;
                    }

                    .empty-icon {
                        font-size: 2rem;
                        margin-bottom: 0.75rem;
                    }

                    .empty-title {
                        font-size: 1.1rem;
                    }

                    .empty-description {
                        font-size: 0.85rem;
                    }
                }
            `}</style>
        </div>
    );
}
