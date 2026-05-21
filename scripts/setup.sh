#!/bin/bash

# MangaDen Setup Script
# Installs dependencies and runs initial database migrations

set -e

echo "🚀 Setting up MangaDen..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Run database migrations
echo "🗄️  Running database migrations..."
pnpm db:migrate

# Optional: Seed database
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    pnpm db:seed
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy environment files if not already done:"
echo "   - backend/.env (from backend/.env.example)"
echo "   - frontend/.env (from frontend/.env.example)"
echo ""
echo "2. Start development servers:"
echo "   pnpm dev"
echo ""
echo "3. Frontend will be available at: http://localhost:4321"
echo "4. Backend will be available at: http://localhost:3000"
