import { useState, useEffect } from "react";

interface Page {
  id: string;
  pageNumber: number;
  imageUrl: string;
}

interface MangaReaderProps {
  mangaSlug: string;
  mangaTitle: string;
  chapterNumber: number;
  chapterTitle?: string;
  pages: Page[];
  totalChapters: number;
}

export default function MangaReader({
  mangaSlug,
  mangaTitle,
  chapterNumber,
  chapterTitle,
  pages,
  totalChapters,
}: MangaReaderProps) {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide header on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  return (
    <div className="reader-container">
      {/* Header */}
      <header className={`reader-header ${showHeader ? "visible" : ""}`}>
        <a href={`/comic/${mangaSlug}`} className="back-btn">
          ←
        </a>
        <div className="header-info">
          <span className="manga-title">{mangaTitle}</span>
          <span className="chapter-info">
            Ch. {chapterNumber} {chapterTitle && `- ${chapterTitle}`}
          </span>
        </div>
        <a href="/" className="home-btn">🏠</a>
      </header>

      {/* All Pages - Vertical Scroll */}
      <div className="pages-container">
        {sortedPages.map((page) => (
          <img
            key={page.id}
            src={page.imageUrl}
            alt={`Page ${page.pageNumber}`}
            className="page-image"
            loading="lazy"
          />
        ))}
      </div>

      {/* Chapter Navigation at Bottom */}
      <div className="chapter-nav">
        {chapterNumber > 1 ? (
          <a href={`/comic/${mangaSlug}/chapter/${chapterNumber - 1}`} className="chapter-link">
            ← Prev
          </a>
        ) : <div />}

        <a href={`/comic/${mangaSlug}`} className="chapter-link center">
          All Chapters
        </a>

        {chapterNumber < totalChapters ? (
          <a href={`/comic/${mangaSlug}/chapter/${chapterNumber + 1}`} className="chapter-link">
            Next →
          </a>
        ) : <div />}
      </div>

      <style>{`
        .reader-container {
          min-height: 100vh;
          background: #000;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .reader-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          padding-top: calc(0.5rem + env(safe-area-inset-top));
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          transform: translateY(-100%);
          transition: transform 0.3s ease;
        }

        .reader-header.visible {
          transform: translateY(0);
        }

        .back-btn,
        .home-btn {
          color: white;
          text-decoration: none;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          font-size: 1rem;
        }

        .header-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.125rem;
          flex: 1;
          min-width: 0;
          padding: 0 0.5rem;
        }

        .manga-title {
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .chapter-info {
          color: rgba(255,255,255,0.6);
          font-size: 0.75rem;
        }

        .pages-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 50px;
          padding-bottom: 80px;
          gap: 0;
          background: #000;
        }

        .page-image {
          width: 100%;
          max-width: 100%;
          height: auto;
          display: block;
        }

        @media (min-width: 768px) {
          .page-image {
            max-width: 800px;
          }
          .pages-container {
            padding-top: 60px;
          }
        }

        .chapter-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(8px);
          border-top: 1px solid rgba(255,255,255,0.1);
          gap: 0.5rem;
        }

        .chapter-link {
          flex: 1;
          padding: 0.75rem 0.5rem;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          text-align: center;
          transition: opacity 0.2s;
        }

        .chapter-link.center {
          background: rgba(255,255,255,0.1);
        }

        .chapter-link:active {
          opacity: 0.8;
        }

        @media (min-width: 768px) {
          .chapter-nav {
            justify-content: center;
            gap: 1rem;
            padding: 1rem;
          }
          
          .chapter-link {
            flex: none;
            padding: 0.75rem 2rem;
            border-radius: 9999px;
          }
        }
      `}</style>
    </div>
  );
}
