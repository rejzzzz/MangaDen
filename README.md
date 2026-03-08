# MangaDen 📚

A modern manga reading platform built with Astro, React, and Hono.

## Tech Stack

### Frontend

- **Astro 5** - Static site generation with islands architecture
- **React 19** - Interactive components
- **TypeScript** - Type safety

### Backend

- **Hono** - Ultralight web framework
- **Drizzle ORM** - Type-safe database queries
- **Better Auth** - Authentication with OAuth support

### Infrastructure

- **Supabase** - PostgreSQL database
- **Upstash** - Redis caching
- **Cloudinary** - Image storage and optimization
- **Docker** - Containerized deployment

## Project Structure

```
mangaden/
├── apps/
│   ├── api/          # Hono backend API
│   └── web/          # Astro frontend
├── packages/
│   └── shared/       # Shared types and utilities
└── docker-compose.yml
```

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (for production deployment)

## Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

**Backend** (`apps/api/.env`):

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your credentials
```

**Frontend** (`apps/web/.env`):

```bash
cp apps/web/.env.example apps/web/.env
```

### 3. Run Database Migrations

```bash
pnpm db:migrate
```

### 4. (Optional) Seed Database

```bash
pnpm --filter @mangaden/api db:seed
```

### 5. Start Development Servers

```bash
pnpm dev
```

This runs both frontend and backend concurrently:

- Frontend: http://localhost:4321
- Backend: http://localhost:3000

## Available Scripts

### Development

```bash
pnpm dev              # Run both frontend and backend
pnpm dev:api          # Run backend only
pnpm dev:web          # Run frontend only
```

### Build

```bash
pnpm build            # Build both apps
pnpm build:api        # Build backend only
pnpm build:web        # Build frontend only
```

### Database

```bash
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
```

### Docker (Production)

```bash
docker-compose up -d          # Start containers
docker-compose down           # Stop containers
docker-compose logs -f        # View logs
```

## Production Deployment

### Using Docker

1. **Build and start containers:**

```bash
docker-compose up -d --build
```

2. **Check health:**

```bash
docker-compose ps
```

3. **View logs:**

```bash
docker-compose logs -f api
docker-compose logs -f web
```

### Using Vercel

The project is configured for Vercel deployment:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Environment Variables

### Required for Backend

- `DATABASE_URL` - Supabase PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `BETTER_AUTH_SECRET` - Random secret for auth
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### Optional OAuth

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

## Features

- 📖 Manga reading with vertical scroll
- 🔍 Search and browse functionality
- 🔐 Authentication (email/password + OAuth)
- 💾 Reading progress tracking
- ⭐ Favorites system
- 🎨 Dark theme with responsive design
- ⚡ Redis caching for performance
- 🖼️ Cloudinary image optimization

## API Endpoints

```
GET    /api/manga              # List manga
GET    /api/manga/:slug        # Get manga details
GET    /api/chapters/manga/:slug  # Get chapters
GET    /api/chapters/:id/pages    # Get chapter pages
POST   /api/auth/*             # Authentication
POST   /api/upload             # Upload images (admin)
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a PR.
