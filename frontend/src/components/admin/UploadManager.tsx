import React, { useState, useRef, useEffect } from "react";
import type { PdfJob } from "@mangaden/shared/types";
import { adminApi } from "../../lib/admin-api";

interface UploadManagerProps {
    chapterId: string;
    onUploadComplete?: () => void;
}

/**
 * Handles PDF drag-and-drop uploads for manga chapters, triggering background
 * page extraction jobs and polling status updates in real-time.
 */
export function UploadManager({ chapterId, onUploadComplete }: UploadManagerProps) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<PdfJob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Poll for job status
    useEffect(() => {
        if (!jobId) return;

        const interval = setInterval(async () => {
            try {
                const res = await adminApi.getUploadJobStatus(jobId);
                
                if (res.success && res.data) {
                    const status = res.data;
                    setJobStatus(status);

                    if (status.status === "completed") {
                        clearInterval(interval);
                        setJobId(null);
                        setUploading(false);
                        setFile(null);
                        if (onUploadComplete) onUploadComplete();
                    } else if (status.status === "failed") {
                        clearInterval(interval);
                        setJobId(null);
                        setUploading(false);
                        setError(status.error || "Background page extraction failed.");
                    }
                } else {
                    throw new Error(res.error || "Failed to fetch job status");
                }
            } catch (err: any) {
                console.error("Polling job status failed:", err);
            }
        }, 2000); // poll every 2 seconds

        return () => clearInterval(interval);
    }, [jobId, onUploadComplete]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "application/pdf") {
                setFile(droppedFile);
                setError(null);
            } else {
                setError("Please upload a PDF file.");
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const triggerUpload = () => {
        inputRef.current?.click();
    };

    const handleUpload = async () => {
        if (!file) return;
        
        setUploading(true);
        setError(null);

        try {
            const res = await adminApi.uploadPdfPages(chapterId, file);
            if (!res.success) {
                setError(res.error || res.message || "Failed to initiate upload.");
                setUploading(false);
                return;
            }
            
            if (res.data?.jobId) {
                setJobId(res.data.jobId);
                setJobStatus({
                    id: res.data.jobId,
                    chapterId,
                    status: "pending",
                    createdAt: Date.now()
                });
            } else {
                // If it completed synchronously
                setUploading(false);
                setFile(null);
                if (onUploadComplete) onUploadComplete();
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during upload.");
            setUploading(false);
        }
    };

    return (
        <div className="upload-manager">
            {error && (
                <div className="alert error mb-md">
                    <span className="icon">⚠️</span>
                    {error}
                </div>
            )}

            {!uploading && !jobId && (
                <div 
                    className={`dropzone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerUpload}
                >
                    <input 
                        ref={inputRef}
                        type="file" 
                        accept="application/pdf"
                        onChange={handleChange} 
                        style={{ display: "none" }} 
                    />
                    
                    <div className="dropzone-content">
                        <div className="upload-icon">📄</div>
                        {file ? (
                            <div className="file-info">
                                <h4>{file.name}</h4>
                                <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                <button 
                                    className="btn btn-primary mt-md" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpload();
                                    }}
                                >
                                    Start Upload
                                </button>
                                <button 
                                    className="btn btn-text mt-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="empty-info">
                                <h4>Drag & Drop your PDF here</h4>
                                <p>or click to browse files</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(uploading || jobId) && (
                <div className="progress-container glass">
                    <div className="progress-header">
                        <h4>Processing PDF: {file?.name}</h4>
                        <span className={`status-badge ${jobStatus?.status || 'processing'}`}>
                            {jobStatus?.status || "uploading..."}
                        </span>
                    </div>
                    
                    <div className="progress-bar-wrapper">
                        <div 
                            className={`progress-bar ${jobStatus?.status !== 'completed' ? 'indeterminate' : ''}`}
                            style={{ width: jobStatus?.status === 'completed' ? '100%' : '50%' }}
                        ></div>
                    </div>
                    
                    <div className="progress-stats">
                        <span>
                            {jobStatus?.status === "completed" 
                                ? `${jobStatus.pagesCount || 0} pages extracted successfully`
                                : "Extracting pages from PDF..."}
                        </span>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                .upload-manager {
                    width: 100%;
                }

                .dropzone {
                    border: 2px dashed rgba(255, 255, 255, 0.2);
                    border-radius: var(--radius-lg);
                    padding: var(--space-2xl) var(--space-lg);
                    text-align: center;
                    cursor: pointer;
                    transition: var(--transition-base);
                    background: rgba(0, 0, 0, 0.2);
                }

                .dropzone.active {
                    border-color: var(--color-accent);
                    background: rgba(139, 92, 246, 0.1);
                }

                .dropzone.has-file {
                    border-style: solid;
                    border-color: rgba(255, 255, 255, 0.1);
                    cursor: default;
                }

                .dropzone-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--space-md);
                }

                .upload-icon {
                    font-size: 3rem;
                    opacity: 0.8;
                }

                .empty-info h4 {
                    font-size: 1.2rem;
                    color: var(--color-text-primary);
                    margin-bottom: var(--space-xs);
                }

                .empty-info p {
                    color: var(--color-text-secondary);
                }

                .file-info h4 {
                    font-size: 1.1rem;
                    color: var(--color-accent);
                }

                .file-info p {
                    color: var(--color-text-secondary);
                    font-size: 0.9rem;
                }

                /* Progress Container */
                .progress-container {
                    padding: var(--space-xl);
                    border-radius: var(--radius-lg);
                    background: var(--color-bg-card);
                }

                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-lg);
                }

                .progress-header h4 {
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .status-badge {
                    padding: 0.3rem 0.8rem;
                    border-radius: var(--radius-full);
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .status-badge.processing, .status-badge.pending {
                    background: rgba(139, 92, 246, 0.2);
                    color: #a78bfa;
                    animation: pulse 2s infinite;
                }
                
                .status-badge.completed {
                    background: rgba(34, 197, 94, 0.2);
                    color: #4ade80;
                }

                .status-badge.failed {
                    background: rgba(239, 68, 68, 0.2);
                    color: #f87171;
                }

                .progress-bar-wrapper {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: var(--radius-full);
                    overflow: hidden;
                    margin-bottom: var(--space-sm);
                    position: relative;
                }

                .progress-bar {
                    height: 100%;
                    background: var(--gradient-primary);
                    border-radius: var(--radius-full);
                    transition: width 0.3s ease;
                }
                
                .progress-bar.indeterminate {
                    animation: indeterminate-progress 1.5s infinite linear;
                    transform-origin: left;
                }
                
                @keyframes indeterminate-progress {
                    0% {
                        transform: translateX(-100%) scaleX(1);
                    }
                    50% {
                        transform: translateX(0%) scaleX(1.5);
                    }
                    100% {
                        transform: translateX(200%) scaleX(1);
                    }
                }

                .progress-stats {
                    display: flex;
                    justify-content: space-between;
                    color: var(--color-text-secondary);
                    font-size: 0.85rem;
                }
            `}} />
        </div>
    );
}
