# PrimeBettingPicks

Expert football predictions, betting tips, and match analysis platform built with Next.js 16, Prisma 7, and MySQL.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5.7
- **Database:** MySQL with Prisma 7 ORM
- **Styling:** Tailwind CSS 4
- **Auth:** JWT (cookie-based)
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 5.6+ or MariaDB 10.0+

### Setup

1. Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd primebettingpicks
npm install
```

2. Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

3. Update `.env` with your database credentials and a secure `JWT_SECRET`.

4. Create the MySQL database:

```sql
CREATE DATABASE primebettingpicks;
```

5. Push the Prisma schema to the database:

```bash
npx prisma generate
npx prisma db push
```

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run setup` | Install + generate + push |

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    (auth)/               # Auth route group (login, register, profile)
    admin/                # Admin panel pages
    api/                  # API routes
  components/
    admin/                # Admin-specific components
    common/               # Shared components (search, pagination, cards)
    layout/               # Header, Footer
    live/                 # Live match components
    predictions/          # Prediction-related components
    ui/                   # Base UI components (Button, Card, Badge, etc.)
  hooks/                  # Custom React hooks
  lib/                    # Utilities, auth, prisma client, constants
  providers/              # React context providers (auth, theme)
  types/                  # TypeScript type definitions
```

## Features

- **Predictions:** Expert football predictions with win probability, odds comparison, head-to-head analysis
- **Live Scores:** Real-time match tracking with live stats
- **Multi-league:** Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League
- **Admin Panel:** Full CRUD for matches, predictions, teams, leagues, news, SEO, and ads
- **Authentication:** JWT-based auth with role-based access control
- **Dark Mode:** System-aware theme toggle
- **SEO:** Auto-generated sitemap, robots.txt, OpenGraph metadata
- **Responsive:** Mobile-first design with Tailwind CSS
