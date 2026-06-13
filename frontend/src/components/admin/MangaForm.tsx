import React, { useState } from "react";
import type { Manga } from "@mangaden/shared/types";
import { adminApi } from "../../lib/admin-api";

interface MangaFormProps {
    initialData?: Manga;
    isEdit?: boolean;
}

export function MangaForm({ initialData, isEdit = false }: MangaFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        description: initialData?.description || "",
        coverUrl: initialData?.coverUrl || "",
        author: initialData?.author || "",
        artist: initialData?.artist || "",
        status: initialData?.status || "ongoing",
        type: initialData?.type || "manga",
        releaseYear: initialData?.releaseYear || new Date().getFullYear(),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'releaseYear' ? parseInt(value) || 0 : value
        }));
        
        // Auto-generate slug from title if not editing
        if (name === "title" && !isEdit) {
            setFormData(prev => ({
                ...prev,
                slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            let res;
            if (isEdit && initialData?.id) {
                res = await adminApi.updateManga(initialData.id, formData);
            } else {
                res = await adminApi.createManga(formData);
            }

            if (!res.success) {
                setError(res.error || res.message || "Failed to save comic.");
            } else {
                setSuccess(true);
                if (!isEdit) {
                    // Redirect to chapters page on create
                    window.location.href = `/admin/comics/${res.data?.slug}/chapters`;
                } else {
                    // Refresh data or show success
                    setTimeout(() => setSuccess(false), 3000);
                }
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="manga-form">
            {error && (
                <div className="alert error">
                    <span className="icon">⚠️</span>
                    {error}
                </div>
            )}
            
            {success && (
                <div className="alert success">
                    <span className="icon">✅</span>
                    Comic successfully saved!
                </div>
            )}

            <div className="form-layout">
                {/* Left Column - Main Details */}
                <div className="form-main glass card-panel">
                    <h3 className="section-title">Core Information</h3>
                    
                    <div className="form-group">
                        <label htmlFor="title">Title *</label>
                        <input 
                            type="text" 
                            id="title" 
                            name="title" 
                            value={formData.title}
                            onChange={handleChange}
                            required 
                            placeholder="e.g. Solo Leveling" 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="slug">Slug (URL) *</label>
                        <input 
                            type="text" 
                            id="slug" 
                            name="slug" 
                            value={formData.slug}
                            onChange={handleChange}
                            required 
                            disabled={isEdit}
                            placeholder="e.g. solo-leveling" 
                        />
                        {isEdit && <span className="help-text">Slug cannot be changed after creation to preserve SEO.</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Synopsis / Description</label>
                        <textarea 
                            id="description" 
                            name="description" 
                            value={formData.description}
                            onChange={handleChange}
                            rows={6}
                            placeholder="Briefly describe the story..."
                        />
                    </div>
                </div>

                {/* Right Column - Meta & Media */}
                <div className="form-sidebar">
                    <div className="glass card-panel">
                        <h3 className="section-title">Cover Image</h3>
                        
                        <div className="cover-preview">
                            {formData.coverUrl ? (
                                <img src={formData.coverUrl} alt="Cover preview" />
                            ) : (
                                <div className="cover-placeholder">
                                    <span>No Image Provided</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="form-group mt-4">
                            <label>Upload Cover Image</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setUploadingCover(true);
                                    try {
                                        const res = await adminApi.uploadCover(file);
                                        if (res.success && res.data?.url) {
                                            setFormData(prev => ({ ...prev, coverUrl: res.data!.url }));
                                        } else {
                                            setError(res.error || "Failed to upload cover image.");
                                        }
                                    } catch (err: any) {
                                        setError(err.message || "Upload failed");
                                    } finally {
                                        setUploadingCover(false);
                                    }
                                }}
                                disabled={uploadingCover}
                            />
                            {uploadingCover && <span className="help-text" style={{color: '#8b5cf6'}}>Uploading to Cloudinary...</span>}
                        </div>
                    </div>

                    <div className="glass card-panel mt-lg">
                        <h3 className="section-title">Metadata</h3>
                        
                        <div className="grid-2">
                            <div className="form-group">
                                <label htmlFor="type">Type</label>
                                <select name="type" id="type" value={formData.type} onChange={handleChange}>
                                    <option value="manga">Manga (JP)</option>
                                    <option value="manhwa">Manhwa (KR)</option>
                                    <option value="manhua">Manhua (CN)</option>
                                    <option value="webtoon">Webtoon</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">Status</label>
                                <select name="status" id="status" value={formData.status} onChange={handleChange}>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                    <option value="hiatus">Hiatus</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid-2 mt-md">
                            <div className="form-group">
                                <label htmlFor="author">Author</label>
                                <input 
                                    type="text" 
                                    id="author" 
                                    name="author" 
                                    value={formData.author}
                                    onChange={handleChange}
                                    placeholder="Story creator" 
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="artist">Artist</label>
                                <input 
                                    type="text" 
                                    id="artist" 
                                    name="artist" 
                                    value={formData.artist}
                                    onChange={handleChange}
                                    placeholder="Illustrator" 
                                />
                            </div>
                        </div>
                        
                        <div className="form-group mt-md">
                            <label htmlFor="releaseYear">Release Year</label>
                            <input 
                                type="number" 
                                id="releaseYear" 
                                name="releaseYear" 
                                value={formData.releaseYear}
                                onChange={handleChange}
                                min="1950" 
                                max="2050" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="form-actions glass">
                <button type="button" className="btn btn-secondary" onClick={() => window.history.back()}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : isEdit ? "Update Comic" : "Create Comic"}
                </button>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .manga-form {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-xl);
                    padding-bottom: 100px; /* Space for sticky actions */
                }

                .form-layout {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: var(--space-lg);
                }

                @media (max-width: 900px) {
                    .form-layout {
                        grid-template-columns: 1fr;
                    }
                }

                /* Image Preview */
                .cover-preview {
                    width: 100%;
                    aspect-ratio: 2/3;
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    background: rgba(0, 0, 0, 0.3);
                    border: 2px dashed rgba(255, 255, 255, 0.1);
                }

                .cover-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .cover-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-text-muted);
                    font-size: 0.9rem;
                }

                /* Actions */
                .form-actions {
                    position: fixed;
                    bottom: 0;
                    left: 280px; /* Sidebar width */
                    right: 0;
                    padding: var(--space-md) var(--space-2xl);
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--space-md);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    z-index: 10;
                }
                
                @media (max-width: 768px) {
                    .form-actions { left: 0; }
                }
            `}} />
        </form>
    );
}
