import { useState, useEffect } from "react";
import { getCurrentUser, signOut } from "../lib/auth-client";
import AuthModal from "./AuthModal";

export default function UserMenu() {
    const [user, setUser] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    useEffect(() => {
        const init = async () => {
            const currentUser = await getCurrentUser();
            if (currentUser) setUser(currentUser);
        };
        init();

        const savedTheme = localStorage.getItem("theme");
        const resolvedTheme = savedTheme === "light" ? "light" : "dark";
        setTheme(resolvedTheme);
        document.documentElement.setAttribute("data-theme", resolvedTheme);
    }, []);

    useEffect(() => {
        const close = () => setShowDropdown(false);
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, []);

    const handleLogout = async () => {
        await signOut();
        setUser(null);
        setShowDropdown(false);
        // Optionally reload the page to clear any cached data
        window.location.reload();
    };

    const handleAuthSuccess = () => {
        getCurrentUser().then((currentUser) => {
            if (currentUser) setUser(currentUser);
        });
    };

    const handleThemeToggle = () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        document.documentElement.setAttribute("data-theme", nextTheme);
        localStorage.setItem("theme", nextTheme);
        setShowDropdown(false);
    };

    return (
        <>
            <div className="user-menu" onClick={(e) => e.stopPropagation()}>
                <button
                    className="user-button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-label="Open account menu"
                >
                    {user?.username?.[0]?.toUpperCase() || "U"}
                </button>

                {showDropdown && (
                    <div className="dropdown">
                        {user ? (
                            <>
                                <div className="dropdown-header">
                                    <div className="avatar-pill">
                                        {(user.username || user.email || "U")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="username">
                                            {user.username || user.email}
                                        </div>
                                        <div className="email">{user.email}</div>
                                    </div>
                                </div>
                                {user.isAdmin && (
                                    <div className="dropdown-item admin-badge">
                                        Admin
                                    </div>
                                )}
                                <a className="dropdown-item" href="/profile">
                                    Profile
                                </a>
                                <button
                                    className="dropdown-item"
                                    onClick={handleThemeToggle}
                                >
                                    {theme === "dark" ? "Light mode" : "Dark mode"}
                                </button>
                                <button
                                    className="dropdown-item danger"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="dropdown-header">
                                    <div className="avatar-pill">U</div>
                                    <div>
                                        <div className="username">Guest</div>
                                        <div className="email">
                                            Sign in to access your profile
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        setShowDropdown(false);
                                        setShowModal(true);
                                    }}
                                >
                                    Login
                                </button>
                                <button
                                    className="dropdown-item"
                                    onClick={handleThemeToggle}
                                >
                                    {theme === "dark" ? "Light mode" : "Dark mode"}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <AuthModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleAuthSuccess}
            />

            <style>{`
        .user-menu {
          position: relative;
        }

        .user-button {
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent);
          color: #fff;
          border: none;
          border-radius: 9999px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 700;
          transition: background 0.2s, transform 0.2s;
        }

        .user-button:hover {
          background: var(--color-accent-hover);
          transform: translateY(-1px);
        }

        .dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: var(--color-bg-secondary);
          border: 1px solid color-mix(in srgb, var(--color-text-primary) 16%, transparent);
          border-radius: 12px;
          min-width: 240px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
          z-index: 100;
          overflow: hidden;
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid color-mix(in srgb, var(--color-text-primary) 12%, transparent);
          background: color-mix(in srgb, var(--color-bg-tertiary) 55%, transparent);
        }

        .avatar-pill {
          width: 2rem;
          height: 2rem;
          border-radius: 9999px;
          background: var(--color-accent);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex: 0 0 auto;
        }

        .dropdown-item {
          display: block;
          min-height: 44px;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          color: var(--color-text-primary);
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 0.92rem;
        }

        .dropdown-item:hover {
          background: color-mix(in srgb, var(--color-bg-tertiary) 80%, transparent);
        }

        .username {
          font-weight: 600;
          line-height: 1.2;
        }

        .email {
          font-size: 0.82rem;
          color: var(--color-text-muted);
          margin-top: 0.1rem;
          line-height: 1.25;
          word-break: break-word;
        }

        .admin-badge {
          color: var(--color-success);
          font-weight: 600;
          border-bottom: 1px solid color-mix(in srgb, var(--color-text-primary) 10%, transparent);
        }

        .danger {
          border-top: 1px solid color-mix(in srgb, var(--color-text-primary) 10%, transparent);
          color: #ef4444;
        }
      `}</style>
        </>
    );
}
