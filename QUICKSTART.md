# ⚡ Quick Start Guide

Get PATULOD Admin running in 3 minutes.

## Prerequisites

✅ Docker Desktop installed and running  
✅ Node.js (v18+) installed  
✅ pnpm installed (`npm install -g pnpm`)

## Setup (First Time Only)

### Option 1: Automated (Recommended)

```bash
cd C:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin
.\setup-db.ps1
```

That's it! The script does everything.

### Option 2: Manual

```bash
cd C:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin

# 1. Start database
pnpm docker:start

# 2. Generate Better Auth secret
npx -y @better-auth/cli secret
# Copy the secret and add it to .env.local

# 3. Setup database
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed

# 4. Start app
pnpm dev
```

## Login

1. Open: **http://localhost:3000/login**
2. Email: **admin@patulod.com**
3. Password: **admin123**

## Daily Use

```bash
pnpm start
```

Opens database and dev server together.

## Useful Commands

| Command | What it does |
|---------|-------------|
| `pnpm start` | Start database + dev server |
| `pnpm dev` | Start dev server only |
| `pnpm docker:start` | Start database only |
| `pnpm docker:stop` | Stop database |
| `pnpm db:studio` | Open database GUI |
| `pnpm db:reset` | Reset all data |

## Need Help?

📚 See [SCRIPTS.md](./SCRIPTS.md) for all commands  
🗄️ See [DATABASE.md](./DATABASE.md) for database details  
🔐 See [AUTH_SETUP.md](./AUTH_SETUP.md) for auth details

## Troubleshooting

### "Port 5432 already in use"
Another PostgreSQL is running. Stop it or change port in `docker-compose.yml`.

### "Database connection failed"
Wait 10 seconds after starting Docker. Check status: `pnpm docker:ps`

### "Invalid credentials"
Database might not be seeded. Run: `pnpm db:seed`

### "Prisma Client error"
Regenerate client: `pnpm db:generate`

### Start fresh
```bash
pnpm docker:down -v
pnpm setup
```

## What's Next?

✅ Phase 0.5 complete - All UI screens built  
✅ Admin authentication working  
⏳ Next: Mobile user authentication (Phase 1)

## Project Structure

```
patulod-admin/
├── src/
│   ├── routes/         # Pages (TanStack Router)
│   ├── components/     # React components
│   ├── lib/            # Auth, utils
│   ├── mock/           # Mock data (Phase 0.5)
│   └── contexts/       # React contexts
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Seed script
├── docker-compose.yml  # PostgreSQL setup
└── .env.local          # Environment vars
```

Happy coding! 🚀
