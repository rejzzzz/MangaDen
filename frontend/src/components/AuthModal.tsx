import { useState } from "react";
import { signUp, signIn } from "../lib/auth-client";

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
    const [username, setUsername] = useState("");
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
                const result = await signUp(email, password, username);

                if (result.error) {
                    setError(result.error.message || "Registration failed");
                    setLoading(false);
                    return;
                }
            } else {
                const result = await signIn(email, password);

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
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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
                            minLength={6}
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
          align-items: flex-start;
          justify-content: center;
          z-index: 1000;
          padding-top: 80px;
        }

        .modal-content {
          background: #1a1a1a;
          padding: 2rem;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          position: relative;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .modal-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: none;
          border: none;
          color: #999;
          font-size: 1.75rem;
          cursor: pointer;
          line-height: 1;
          padding: 0.25rem;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .modal-close:hover {
          color: #fff;
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
      `}</style>
        </div>
    );
}
