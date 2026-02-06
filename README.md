# 📚 MangaDen

A high-performance manga/manhwa reading platform built with modern web technologies.

## 🛠️ Tech Stack

- **Frontend**: Astro + React (SSG + Islands)
- **Backend**: Hono + TypeScript (Ultralight API)
- **Database**: PostgreSQL + Drizzle ORM
- **Cache**: Redis
- **Storage**: S3/R2 + CDN

## 📁 Project Structure

```
MangaDen/
├── apps/
│   ├── api/           # Hono backend
│   └── web/           # Astro + React frontend
├── packages/
│   └── shared/        # Shared types & utilities
└── docker-compose.yml # Local dev services
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start databases**
   ```bash
   docker-compose up -d
   ```

3. **Setup environment**
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

4. **Run migrations**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. **Start development**
   ```bash
   # Terminal 1 - API
   pnpm dev:api

   # Terminal 2 - Web (after setting up Astro)
   pnpm dev:web
   ```

## 📝 API Endpoints

### Manga
- `GET /api/manga` - List all manga
- `GET /api/manga/:slug` - Get manga details
- `POST /api/manga` - Create manga
- `PATCH /api/manga/:id` - Update manga
- `DELETE /api/manga/:id` - Delete manga

### Chapters
- `GET /api/chapters/manga/:mangaSlug` - Get chapters
- `GET /api/chapters/:id/pages` - Get chapter pages
- `POST /api/chapters` - Create chapter
- `DELETE /api/chapters/:id` - Delete chapter

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

## 🔧 Scripts

```bash
pnpm dev:api      # Start API dev server
pnpm dev:web      # Start web dev server
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
```

## 📄 License

MIT
