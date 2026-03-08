import { useState } from "react";
import { authClient } from "../lib/auth-client";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AuthModal({
    isOpen,
    onClose,
    onSuccess,
}: AuthModalProps) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (mode === "register") {
                const result = await authClient.signUp.email({
                    email,
                    password,
                    name,
                });

                if (result.error) {
                    setError(result.error.message || "Registration failed");
                    setLoading(false);
                    return;
                }
            } else {
                const result = await authClient.signIn.email({
                    email,
                    password,
                });

                if (result.error) {
                    setError(result.error.message || "Login failed");
                    setLoading(false);
                    return;
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
            });
        } catch (err: any) {
            setError(err.message || "Google sign-in failed");
        }
    };

    const handleGithubSignIn = async () => {
        try {
            await authClient.signIn.social({
                provider: "github",
                callbackURL: "/",
            });
        } catch (err: any) {
            setError(err.message || "GitHub sign-in failed");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    ×
                </button>

                <h2>{mode === "login" ? "Login" : "Register"}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {mode === "register" && (
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                minLength={3}
                                maxLength={50}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading
                            ? "Loading..."
                            : mode === "login"
                              ? "Login"
                              : "Register"}
                    </button>
                </form>

                <div className="divider">OR</div>

                <div className="social-buttons">
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="btn-social"
                    >
                        <span>🔍</span> Continue with Google
                    </button>
                    <button
                        type="button"
                        onClick={handleGithubSignIn}
                        className="btn-social"
                    >
                        <span>🐙</span> Continue with GitHub
                    </button>
                </div>

                <p className="toggle-mode">
                    {mode === "login"
                        ? "Don't have an account? "
                        : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === "login" ? "register" : "login");
                            setError("");
                        }}
                    >
                        {mode === "login" ? "Register" : "Login"}
                    </button>
                </p>
            </div>

            <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #1a1a1a;
          padding: 2rem;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: #fff;
          font-size: 2rem;
          cursor: pointer;
          line-height: 1;
        }

        .modal-content h2 {
          margin-bottom: 1.5rem;
          color: #fff;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #ccc;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #333;
          border-radius: 6px;
          background: #0a0a0a;
          color: #fff;
          font-size: 1rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: #8b5cf6;
        }

        .error-message {
          color: #ef4444;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .btn-primary {
          width: 100%;
          padding: 0.75rem;
          background: #8b5cf6;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #7c3aed;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle-mode {
          margin-top: 1rem;
          text-align: center;
          color: #ccc;
        }

        .toggle-mode button {
          background: none;
          border: none;
          color: #8b5cf6;
          cursor: pointer;
          text-decoration: underline;
        }

        .divider {
          text-align: center;
          color: #666;
          margin: 1.5rem 0;
          position: relative;
        }

        .divider::before,
        .divider::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: #333;
        }

        .divider::before {
          left: 0;
        }

        .divider::after {
          right: 0;
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .btn-social {
          width: 100%;
          padding: 0.75rem;
          background: #2a2a2a;
          color: #fff;
          border: 1px solid #333;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-social:hover {
          background: #333;
        }

        .btn-social span {
          font-size: 1.2rem;
        }
      `}</style>
        </div>
    );
}
