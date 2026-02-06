import { useState, useEffect, useRef } from "react";

interface SearchResult {
    id: string;
    title: string;
    slug: string;
    coverUrl?: string;
    type: string;
}

const API_BASE = "http://localhost:3000/api";

export default function LiveSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${API_BASE}/manga?search=${encodeURIComponent(query)}&limit=6`);
                const data = await res.json();
                if (data.success && data.data) {
                    setResults(data.data);
                    setIsOpen(true);
                }
            } catch (e) {
                console.error("Search failed:", e);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="live-search">
            <div className="search-box">
                <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query && results.length > 0 && setIsOpen(true)}
                    placeholder="Search..."
                    className="search-input"
                />
                {isLoading && <span className="loader" />}
            </div>

            {isOpen && results.length > 0 && (
                <div className="dropdown">
                    {results.map((item) => (
                        <a key={item.id} href={`/comic/${item.slug}`} className="result-item">
                            <img
                                src={item.coverUrl || "https://placehold.co/40x60/1a1a24/8b5cf6?text=?"}
                                alt={item.title}
                                className="result-cover"
                            />
                            <div className="result-info">
                                <span className="result-title">{item.title}</span>
                                <span className="result-type">{item.type}</span>
                            </div>
                        </a>
                    ))}
                    <a href={`/search?q=${encodeURIComponent(query)}`} className="view-all">
                        View all results →
                    </a>
                </div>
            )}

            <style>{`
        .live-search {
          position: relative;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          color: rgba(255,255,255,0.4);
          pointer-events: none;
        }

        .search-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px;
          padding: 0.5rem 1rem 0.5rem 2.5rem;
          color: white;
          font-size: 0.875rem;
          width: 140px;
          transition: all 0.2s;
        }

        .search-input::placeholder {
          color: rgba(255,255,255,0.4);
        }

        .search-input:focus {
          outline: none;
          border-color: #8b5cf6;
          width: 200px;
        }

        @media (min-width: 768px) {
          .search-input {
            width: 200px;
          }
          .search-input:focus {
            width: 280px;
          }
        }

        .loader {
          position: absolute;
          right: 0.75rem;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: calc(100vw - 2rem);
          max-width: 360px;
          background: #1a1a24;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          z-index: 1000;
        }

        @media (min-width: 768px) {
          .dropdown {
            left: 0;
            right: auto;
            width: 320px;
          }
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          transition: background 0.15s;
        }

        .result-item:hover {
          background: rgba(139, 92, 246, 0.1);
        }

        .result-cover {
          width: 40px;
          height: 56px;
          object-fit: cover;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .result-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
        }

        .result-title {
          color: white;
          font-weight: 500;
          font-size: 0.875rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .result-type {
          color: rgba(255,255,255,0.5);
          font-size: 0.75rem;
          text-transform: capitalize;
        }

        .view-all {
          display: block;
          padding: 0.75rem 1rem;
          text-align: center;
          color: #8b5cf6;
          font-size: 0.875rem;
          font-weight: 500;
          border-top: 1px solid rgba(255,255,255,0.05);
          transition: background 0.15s;
        }

        .view-all:hover {
          background: rgba(139, 92, 246, 0.1);
        }
      `}</style>
        </div>
    );
}
