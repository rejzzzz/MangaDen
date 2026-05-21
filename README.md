# MangaDen 📚

A modern manga reading platform built with Astro, React, and Hono. Designed for independent frontend and backend deployment.

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
├── backend/              # Hono backend API
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── drizzle.config.ts
├── frontend/             # Astro frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── astro.config.mjs
├── docker/               # Docker configuration
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── scripts/              # Utility scripts
│   ├── setup.sh
│   ├── setup.ps1
│   ├── docker-build.sh
│   └── docker-build.ps1
├── docker-compose.yml    # Production orchestration
├── vercel.json          # Vercel deployment config
├── package.json         # Root workspace config
└── README.md
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

Or use the setup script:

**Linux/macOS:**

```bash
./scripts/setup.sh
```

**Windows (PowerShell):**

```powershell
.\scripts\setup.ps1
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```

**Frontend** (`frontend/.env`):

```bash
cp frontend/.env.example frontend/.env
```

### 3. Run Database Migrations

```bash
pnpm db:migrate
```

### 4. (Optional) Seed Database

```bash
pnpm db:seed
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
pnpm dev:backend      # Run backend only
pnpm dev:frontend     # Run frontend only
```

### Build

```bash
pnpm build            # Build both apps
pnpm build:backend    # Build backend only
pnpm build:frontend   # Build frontend only
```

### Database

```bash
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed          # Seed database with sample data
```

### Docker (Production)

```bash
pnpm docker:build     # Build Docker images
pnpm docker:up        # Start containers
pnpm docker:down      # Stop containers
pnpm docker:logs      # View logs
pnpm docker:restart   # Restart containers
```

## Production Deployment

### Using Docker Compose

1. **Configure environment variables:**

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with production credentials
```

2. **Build and start containers:**

```bash
pnpm docker:up --build
```

Or manually:

```bash
docker-compose up -d --build
```

3. **Check health:**

```bash
docker-compose ps
```

4. **View logs:**

```bash
docker-compose logs -f backend
```

### Using Vercel (Frontend Only)

The frontend is configured for Vercel deployment:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Vercel will automatically:

- Build the frontend using `pnpm --filter mangaden-frontend build`
- Deploy to `frontend/dist`

### Independent Deployment

**Backend:**

- Deploy `backend/` directory to any Node.js hosting (Heroku, Railway, Render, etc.)
- Ensure environment variables are set
- Run `pnpm dev` or `pnpm build && pnpm start`

**Frontend:**

- Deploy to Vercel, Netlify, or any static host
- Update `PUBLIC_API_URL` environment variable to point to backend

## Environment Variables

### Backend (`backend/.env`)

**Required:**

- `DATABASE_URL` - Supabase PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `BETTER_AUTH_SECRET` - Random secret for auth
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

**Optional OAuth:**

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

### Frontend (`frontend/.env`)

- `PUBLIC_API_URL` - Backend API URL (default: http://localhost:3000)

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

## Troubleshooting

### Port Already in Use

If port 3000 or 4321 is already in use:

**Backend:**

```bash
PORT=3001 pnpm dev:backend
```

**Frontend:**

```bash
pnpm dev:frontend -- --port 4322
```

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check Supabase project is active
3. Run migrations: `pnpm db:migrate`

### Docker Build Fails

1. Ensure Docker is running
2. Check disk space: `docker system df`
3. Clean up: `docker system prune`

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a PR.
