import { useEffect, useState } from "react";
import { getCurrentUser } from "../lib/auth-client";

export default function ProfilePanel() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getCurrentUser().then((u) => {
            setUser(u);
            setLoading(false);
        });
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        setError(null);
        setMessage(null);

        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);
        setMessage(null);

        try {
            const apiBase =
                import.meta.env.PUBLIC_API_URL || "http://localhost:3000";
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await fetch(`${apiBase}/api/user/avatar`, {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to upload avatar");
            }

            setUser(result.data.user);
            setSelectedFile(null);
            setPreviewUrl(null);
            setMessage("Profile picture updated");
        } catch (err: any) {
            setError(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <section className="profile-card">Loading profile...</section>;

    if (!user) {
        return (
            <section className="profile-card">
                <h1>Profile</h1>
                <p className="muted">You are not logged in.</p>
                <a href="/" className="go-home">
                    Go to home and login
                </a>
            </section>
        );
    }

    return (
        <section className="profile-card">
            <div className="profile-top">
                <div className="avatar-wrap">
                    <img
                        className="avatar"
                        src={
                            previewUrl ||
                            user.avatarUrl ||
                            "https://placehold.co/160x160/8b5cf6/ffffff?text=U"
                        }
                        alt="Profile avatar"
                    />
                </div>
                <div className="profile-head">
                    <h1>My Profile</h1>
                    <p className="muted">Manage your account details</p>
                </div>
            </div>

            <div className="upload-card">
                <div className="upload-title">Profile Photo</div>
                <p className="upload-help">
                    Upload a square image for best results.
                </p>
                <div className="upload-row">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                    />
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="upload-btn"
                    >
                        {uploading ? "Uploading..." : "Upload Photo"}
                    </button>
                </div>
            </div>

            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}

            <div className="row info-row">
                <span className="label">Username</span>
                <span className="value">{user.username || "-"}</span>
            </div>
            <div className="row info-row">
                <span className="label">Email</span>
                <span className="value">{user.email || "-"}</span>
            </div>
            <div className="row info-row">
                <span className="label">Role</span>
                <span className="value">{user.isAdmin ? "Admin" : "User"}</span>
            </div>
        </section>
    );
}
