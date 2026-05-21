import { useState } from "react";
import { api, type TrendingResult } from "../lib/api";

interface TrendingFilterProps {
    onDataChange: (data: TrendingResult | null, loading: boolean) => void;
}

export default function TrendingFilter({ onDataChange }: TrendingFilterProps) {
    const [activePeriod, setActivePeriod] = useState<"1d" | "7d" | "30d">(
        "7d",
    );
    const [loading, setLoading] = useState(false);

    const periods: Array<{ value: "1d" | "7d" | "30d"; label: string }> = [
        { value: "1d", label: "Today" },
        { value: "7d", label: "This Week" },
        { value: "30d", label: "This Month" },
    ];

    const handlePeriodChange = async (
        period: "1d" | "7d" | "30d",
    ) => {
        setActivePeriod(period);
        setLoading(true);
        onDataChange(null, true);

        try {
            const res = await api.getTrending({
                period,
                limit: 24,
                offset: 0,
            });

            if (res.success && res.data) {
                onDataChange(res.data, false);
            } else {
                onDataChange(null, false);
            }
        } catch (error) {
            console.error("Failed to fetch trending:", error);
            onDataChange(null, false);
        }
    };

    return (
        <div class="trending-filter">
            <div class="filter-buttons">
                {periods.map((period) => (
                    <button
                        key={period.value}
                        class={`filter-btn ${activePeriod === period.value ? "active" : ""
                            }`}
                        onClick={() => handlePeriodChange(period.value)}
                        disabled={loading}
                    >
                        {period.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

<style>
    .trending-filter {
        margin - bottom: 2rem;
    }

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
        border - color: color-mix(in srgb, var(--color-text-primary) 40%, transparent);
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

    @media (max-width: 768px) {
        .filter - buttons {
        gap: 0.5rem;
        }

    .filter-btn {
        padding: 0.5rem 1rem;
    font-size: 0.85rem;
        }
    }
</style>
