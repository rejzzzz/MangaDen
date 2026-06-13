import React, { useState, useEffect } from "react";
import type { Page } from "@mangaden/shared/types";
import { api } from "../../lib/api";
import { adminApi } from "../../lib/admin-api";

interface PageListProps {
    chapterId: string;
    refreshTrigger?: number;
}

export function PageList({ chapterId, refreshTrigger = 0 }: PageListProps) {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchPages = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.getChapterPages(chapterId);
            if (res.success && res.data) {
                // sort by pageNumber
                const sortedPages = (res.data.pages || []).sort((a, b) => a.pageNumber - b.pageNumber);
                setPages(sortedPages);
            } else {
                setError(res.error || "Failed to load pages");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, [chapterId, refreshTrigger]);

    const handleDelete = async (pageId: string) => {
        if (!window.confirm("Are you sure you want to delete this page?")) return;
        
        setDeletingId(pageId);
        try {
            const res = await adminApi.deletePage(pageId);
            if (res.success) {
                setPages(pages.filter((p) => p.id !== pageId));
            } else {
                alert(res.error || "Failed to delete page");
            }
        } catch (err: any) {
            alert(err.message || "An unexpected error occurred");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return <div className="page-list-loading">Loading pages...</div>;
    }

    if (error) {
        return <div className="alert error">⚠️ {error}</div>;
    }

    if (pages.length === 0) {
        return <div className="page-list-empty" style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>No pages uploaded yet.</div>;
    }

    return (
        <div className="page-list-container">
            <h4>Uploaded Pages ({pages.length})</h4>
            <div className="page-grid">
                {pages.map((page) => (
                    <div key={page.id} className="page-item glass">
                        <div className="page-number-badge">Page {page.pageNumber}</div>
                        <div className="page-image-wrapper">
                            <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} loading="lazy" />
                        </div>
                        <div className="page-actions">
                            <button
                                className="icon-btn delete-btn"
                                onClick={() => handleDelete(page.id)}
                                disabled={deletingId === page.id}
                                title="Delete Page"
                            >
                                {deletingId === page.id ? "⏳" : "🗑️"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .page-list-container {
                    margin-top: var(--space-xl);
                }
                .page-list-container h4 {
                    margin-bottom: var(--space-md);
                    font-size: 1.1rem;
                    color: var(--color-text-primary);
                }
                .page-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: var(--space-md);
                }
                .page-item {
                    position: relative;
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .page-number-badge {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    background: rgba(0,0,0,0.7);
                    color: white;
                    padding: 2px 8px;
                    border-radius: var(--radius-full);
                    font-size: 0.75rem;
                    font-weight: bold;
                    z-index: 10;
                }
                .page-image-wrapper {
                    width: 100%;
                    aspect-ratio: 2/3;
                    background: rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .page-image-wrapper img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .page-actions {
                    padding: var(--space-xs);
                    display: flex;
                    justify-content: flex-end;
                    background: rgba(255,255,255,0.05);
                }
                .icon-btn.delete-btn {
                    background: rgba(239, 68, 68, 0.1);
                    color: var(--color-error);
                    border: none;
                    border-radius: var(--radius-sm);
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .icon-btn.delete-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    transform: translateY(-2px);
                }
                .icon-btn.delete-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}} />
        </div>
    );
}
