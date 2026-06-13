import { useState } from "react";
import { api, type TrendingResult } from "../lib/api";
import "./TrendingFilter.css";

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
        <div className="trending-filter">
            <div className="filter-buttons">
                {periods.map((period) => (
                    <button
                        key={period.value}
                        className={`filter-btn ${activePeriod === period.value ? "active" : ""
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
