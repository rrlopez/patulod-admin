# PostgreSQL Database Setup with Docker

This guide helps you set up and manage the PostgreSQL database for PATULOD Admin using Docker.

## Prerequisites

- Docker Desktop installed and running on Windows
- Docker Compose (comes with Docker Desktop)

## Quick Start

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

This will:
- Download PostgreSQL 16 Alpine image (if not already downloaded)
- Start PostgreSQL container in detached mode
- Expose port 5432 on localhost
- Create a persistent volume for data

### 2. Verify Database is Running

```bash
docker-compose ps
```

You should see `patulod-postgres` with status `Up` and healthy.

### 3. Generate Better Auth Secret

```bash
npx -y @better-auth/cli secret
```

Copy the generated secret and add it to `.env.local`:
```env
BETTER_AUTH_SECRET=<paste-generated-secret-here>
```

### 4. Setup Database Schema

```bash
pnpm install
pnpm db:generate
pnpm db:push
```

### 5. Seed Admin User

```bash
pnpm db:seed
```

## Database Connection Details

- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `patulod_admin_db`
- **User:** `patulod_admin`
- **Password:** `patulod_dev_password`

**Full connection string:**
```
postgresql://patulod_admin:patulod_dev_password@localhost:5432/patulod_admin_db
```

## Useful Commands

### Start Database
```bash
docker-compose up -d
```

### Stop Database
```bash
docker-compose stop
```

### Stop and Remove Container (keeps data)
```bash
docker-compose down
```

### Stop and Remove Everything (including data)
```bash
docker-compose down -v
```

### View Logs
```bash
docker-compose logs -f postgres
```

### Access PostgreSQL CLI
```bash
docker exec -it patulod-postgres psql -U patulod_admin -d patulod_admin_db
```

### Check Database Status
```bash
docker-compose ps
```

### Restart Database
```bash
docker-compose restart
```

## Prisma Studio (Database GUI)

To view and manage your database with a GUI:

```bash
pnpm db:studio
```

This opens Prisma Studio at `http://localhost:5555`

## Troubleshooting

### Port 5432 Already in Use

If you have another PostgreSQL instance running:

**Option 1:** Stop the other PostgreSQL
```bash
# Windows: Stop PostgreSQL service
net stop postgresql
```

**Option 2:** Change the port in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use 5433 on host instead
```

Then update `.env.local`:
```env
DATABASE_URL="postgresql://patulod_admin:patulod_dev_password@localhost:5433/patulod_admin_db"
```

### Container Won't Start

1. Check Docker Desktop is running
2. Check logs: `docker-compose logs postgres`
3. Try removing and recreating:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Connection Refused

1. Verify container is running: `docker-compose ps`
2. Check health status: `docker-compose ps` (should show "healthy")
3. Wait a few seconds for PostgreSQL to fully start
4. Check `.env.local` has correct DATABASE_URL

### Lost Data

If you ran `docker-compose down -v`, the volume was deleted. To recover:

1. Start database: `docker-compose up -d`
2. Push schema: `pnpm db:push`
3. Reseed: `pnpm db:seed`

## Data Persistence

Data is stored in a Docker volume named `patulod-admin_postgres_data`.

To backup:
```bash
docker exec patulod-postgres pg_dump -U patulod_admin patulod_admin_db > backup.sql
```

To restore:
```bash
docker exec -i patulod-postgres psql -U patulod_admin -d patulod_admin_db < backup.sql
```

## Development Workflow

### Daily Start
```bash
docker-compose up -d
pnpm dev
```

### Daily End
```bash
# Stop dev server (Ctrl+C)
docker-compose stop  # Optional: keep it running
```

### Reset Database
```bash
pnpm db:push --force-reset
pnpm db:seed
```

## Production Notes

⚠️ **Do NOT use this Docker setup in production!**

For production:
- Use managed PostgreSQL (Supabase, AWS RDS, etc.)
- Use strong passwords
- Enable SSL/TLS
- Set up backups
- Use read replicas
- Monitor performance

## Next Steps

After database is running:

1. ✅ Generate Prisma Client: `pnpm db:generate`
2. ✅ Push schema: `pnpm db:push`
3. ✅ Seed admin user: `pnpm db:seed`
4. ✅ Start app: `pnpm dev`
5. ✅ Login at `http://localhost:3000/login`
