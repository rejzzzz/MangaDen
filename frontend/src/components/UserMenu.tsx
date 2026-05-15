import { useState, useEffect } from "react";
import { getUser, signOut, isAuthenticated } from "../lib/auth-client";
import AuthModal from "./AuthModal";

export default function UserMenu() {
    const [user, setUser] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        // Check if user is authenticated on mount
        if (isAuthenticated()) {
            const currentUser = getUser();
            if (currentUser) {
                setUser(currentUser);
            }
        }
    }, []);

    const handleLogout = async () => {
        await signOut();
        setUser(null);
        setShowDropdown(false);
        // Optionally reload the page to clear any cached data
        window.location.reload();
    };

    const handleAuthSuccess = () => {
        const currentUser = getUser();
        if (currentUser) {
            setUser(currentUser);
        }
    };

    return (
        <>
            {user ? (
                <div className="user-menu">
                    <button
                        className="user-button"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        {user.username || user.email.split("@")[0]}
                    </button>

                    {showDropdown && (
                        <div className="dropdown">
                            <div className="dropdown-item user-info">
                                <div className="username">
                                    {user.username || user.email}
                                </div>
                                <div className="email">{user.email}</div>
                            </div>
                            {user.isAdmin && (
                                <div className="dropdown-item admin-badge">
                                    Admin
                                </div>
                            )}
                            <button
                                className="dropdown-item"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    className="login-button"
                    onClick={() => setShowModal(true)}
                >
                    Login
                </button>
            )}

            <AuthModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleAuthSuccess}
            />

            <style>{`
        .user-menu {
          position: relative;
        }

        .user-button,
        .login-button {
          padding: 0.5rem 1rem;
          background: #8b5cf6;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.2s;
        }

        .user-button:hover,
        .login-button:hover {
          background: #7c3aed;
        }

        .dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          min-width: 200px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          z-index: 100;
        }

        .dropdown-item {
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          color: #fff;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
        }

        .dropdown-item:hover {
          background: #2a2a2a;
        }

        .dropdown-item.user-info {
          border-bottom: 1px solid #333;
          cursor: default;
        }

        .dropdown-item.user-info:hover {
          background: none;
        }

        .username {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .email {
          font-size: 0.85rem;
          color: #999;
        }

        .admin-badge {
          color: #22c55e;
          font-weight: 600;
          border-bottom: 1px solid #333;
        }
      `}</style>
        </>
    );
}
