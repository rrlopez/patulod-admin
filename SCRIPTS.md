# Package Scripts Reference

Quick reference for all available npm/pnpm scripts in the PATULOD Admin project.

## 🚀 Quick Start Commands

### First Time Setup
```bash
pnpm setup
```
Does everything: installs deps, starts Docker, generates Prisma, pushes schema, seeds database.

### Daily Start
```bash
pnpm start
```
Starts Docker database AND the dev server together.

## 🐳 Docker Commands

### Start Database
```bash
pnpm docker:start
```
Starts PostgreSQL in Docker (detached mode).

### Stop Database
```bash
pnpm docker:stop
```
Stops PostgreSQL container (keeps data).

### Remove Container
```bash
pnpm docker:down
```
Stops and removes container (keeps data volume).

### View Logs
```bash
pnpm docker:logs
```
Follow PostgreSQL logs in real-time (Ctrl+C to exit).

### Restart Database
```bash
pnpm docker:restart
```
Restart PostgreSQL container.

### Check Status
```bash
pnpm docker:ps
```
Show status of Docker containers.

## 💾 Database Commands

### Generate Prisma Client
```bash
pnpm db:generate
```
Generates TypeScript types from Prisma schema.

### Push Schema to Database
```bash
pnpm db:push
```
Syncs Prisma schema with database (development).

### Create Migration
```bash
pnpm db:migrate
```
Creates a migration file (production workflow).

### Open Database GUI
```bash
pnpm db:studio
```
Opens Prisma Studio at http://localhost:5555

### Seed Database
```bash
pnpm db:seed
```
Runs seed script (creates admin@patulod.com user).

### Reset Database
```bash
pnpm db:reset
```
⚠️ Deletes all data, recreates schema, and reseeds.

## 🛠️ Development Commands

### Start Dev Server
```bash
pnpm dev
```
Starts Vite dev server at http://localhost:3000

### Build for Production
```bash
pnpm build
```
Builds the app for production.

### Preview Production Build
```bash
pnpm preview
```
Preview the production build locally.

### Generate Routes
```bash
pnpm generate-routes
```
Regenerates TanStack Router route tree.

## 🧹 Code Quality Commands

### Format Code
```bash
pnpm format
```
Formats all files with Biome.

### Lint Code
```bash
pnpm lint
```
Lints all files with Biome.

### Check Code
```bash
pnpm check
```
Runs both linting and formatting checks.

## 📋 Common Workflows

### Fresh Start (New Machine)
```bash
pnpm setup
pnpm dev
```

### Daily Development
```bash
pnpm start  # Starts DB + Dev Server
# Work on code...
# Ctrl+C to stop dev server
pnpm docker:stop  # Optional: stop database
```

### Database Schema Changed
```bash
pnpm db:push
pnpm db:seed  # If needed
```

### Completely Reset Everything
```bash
pnpm docker:down -v  # Remove container AND volume
pnpm setup           # Start fresh
```

### Check Database Contents
```bash
pnpm db:studio
# Opens GUI at localhost:5555
```

### View Database Logs
```bash
pnpm docker:logs
```

### Production Build
```bash
pnpm build
pnpm preview
```

## 🆘 Troubleshooting

### Database won't start
```bash
pnpm docker:ps       # Check status
pnpm docker:logs     # View errors
pnpm docker:restart  # Try restart
```

### Prisma errors
```bash
pnpm db:generate  # Regenerate client
pnpm db:push      # Sync schema
```

### Port conflicts
```bash
# Check what's using port 5432
netstat -ano | findstr :5432

# Stop the process or change port in docker-compose.yml
```

### Clean slate
```bash
pnpm docker:down
pnpm docker:start
pnpm db:push
pnpm db:seed
```

## 💡 Tips

1. **Keep Docker running during development** - It's lightweight and saves startup time.

2. **Use `pnpm start` daily** - One command to start everything.

3. **Use `pnpm db:studio` to inspect data** - Much easier than SQL commands.

4. **Check logs if something fails** - `pnpm docker:logs` shows what went wrong.

5. **Reset database when stuck** - `pnpm db:reset` is safe in development.

## 🔗 Related Files

- `docker-compose.yml` - Docker configuration
- `.env.local` - Environment variables
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Seed data script
- `DATABASE.md` - Detailed database documentation
- `AUTH_SETUP.md` - Authentication setup guide
