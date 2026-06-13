import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/browse", label: "Browse", icon: "📖" },
  { href: "/latest", label: "Latest", icon: "🔥" },
  { href: "/search", label: "Search", icon: "🔍" },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      {/* Hamburger Button */}
      <button
        className="hamburger-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* Full Screen Mobile Menu */}
      <div className={`mobile-menu-page ${isOpen ? "open" : ""}`}>
        {/* Header with logo and close button */}
        <div className="menu-header">
          <a href="/" className="menu-logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">MangaDen</span>
          </a>
          <button
            className="close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="menu-nav">
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className="menu-link"
              style={{ animationDelay: `${index * 0.05 + 0.1}s` }}
            >
              <span className="link-icon">{link.icon}</span>
              <span className="link-label">{link.label}</span>
              <span className="link-arrow">→</span>
            </a>
          ))}
        </nav>

        {/* Footer Section */}
        <div className="menu-footer">
          <a href="/?login=true" className="login-btn">
            Sign In
          </a>
          <p className="footer-text">Your ultimate manga destination</p>
        </div>
      </div>

      <style>{`
        .hamburger-btn {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.05);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          padding: 8px;
        }

        .hamburger-line {
          display: block;
          width: 20px;
          height: 2px;
          background: white;
          border-radius: 1px;
          transition: transform 0.2s;
        }

        @media (max-width: 768px) {
          .hamburger-btn {
            display: flex;
          }
        }

        /* Full Screen Mobile Menu */
        .mobile-menu-page {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
          z-index: 9999;
          transform: translateX(-100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .mobile-menu-page.open {
          transform: translateX(0);
        }

        /* Menu Header */
        .menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(139, 92, 246, 0.15);
        }

        .menu-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 700;
          font-size: 1.5rem;
        }

        .logo-icon {
          font-size: 1.75rem;
        }

        .logo-text {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .close-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(139, 92, 246, 0.3);
        }

        /* Navigation */
        .menu-nav {
          flex: 1;
          padding: 2rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .menu-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          color: rgba(255, 255, 255, 0.85);
          font-size: 1.25rem;
          font-weight: 500;
          transition: all 0.25s ease;
          border-left: 4px solid transparent;
          opacity: 0;
          transform: translateX(-20px);
          animation: slideIn 0.4s ease forwards;
        }

        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .menu-link:hover,
        .menu-link:active {
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%);
          color: white;
          border-left-color: #8b5cf6;
        }

        .link-icon {
          font-size: 1.75rem;
          width: 40px;
          text-align: center;
        }

        .link-label {
          flex: 1;
        }

        .link-arrow {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease;
        }

        .menu-link:hover .link-arrow {
          color: #8b5cf6;
          transform: translateX(4px);
        }

        /* Footer */
        .menu-footer {
          padding: 2rem 1.5rem;
          border-top: 1px solid rgba(139, 92, 246, 0.15);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .login-btn {
          display: block;
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          color: white;
          font-weight: 600;
          text-align: center;
          border-radius: 12px;
          font-size: 1.125rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(139, 92, 246, 0.5);
        }

        .footer-text {
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.875rem;
        }
      `}</style>
    </>
  );
}
