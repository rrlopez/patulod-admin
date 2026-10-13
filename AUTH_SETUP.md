# Admin Authentication Setup Guide

This guide walks you through setting up and testing the admin authentication system using Better Auth.

## Prerequisites

1. PostgreSQL database running (local or Supabase)
2. Node.js and pnpm installed

## Setup Steps

### 1. Configure Environment Variables

Update `.env.local` with your database credentials:

```env
# Database URL for PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/patulod_admin"

# Better Auth configuration
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET= # Generate with: npx -y @better-auth/cli secret
```

**Generate the auth secret:**
```bash
npx -y @better-auth/cli secret
```

Copy the generated secret and paste it as the `BETTER_AUTH_SECRET` value.

### 2. Generate Prisma Client

```bash
pnpm db:generate
```

This generates the Prisma client with the Better Auth tables and Admin table.

### 3. Push Database Schema

```bash
pnpm db:push
```

This creates all tables in your database:
- `user` - Better Auth users
- `session` - Better Auth sessions
- `account` - Better Auth accounts (stores passwords)
- `verification` - Better Auth verification tokens
- `admins` - PATULOD admin profiles

### 4. Seed Admin User

```bash
pnpm db:seed
```

This creates a test admin account:
- **Email:** `admin@patulod.com`
- **Password:** `admin123`
- **Role:** `SUPER_ADMIN`

## Testing Authentication

### 1. Start the Development Server

```bash
pnpm dev
```

The admin app will be available at `http://localhost:3000`

### 2. Test Login Flow

1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `admin@patulod.com`
   - Password: `admin123`
3. Click "Sign In"
4. You should be redirected to `/dashboard`

### 3. Test Protected Routes

- Try accessing `/dashboard` without logging in first
- You should be redirected to `/login`
- After logging in, all protected routes should be accessible

### 4. Test Logout

- Click on your avatar in the top right
- Click "Logout"
- You should be redirected to `/login`
- Try accessing `/dashboard` - should redirect to login

## Architecture Overview

### Database Schema

```
user (Better Auth)
├── id (String, @id)
├── name (String)
├── email (String, @unique)
├── emailVerified (Boolean)
└── relations: sessions[], accounts[]

account (Better Auth - stores passwords)
├── id (String, @id)
├── userId (String, FK to user)
├── password (String, hashed)
└── Better Auth metadata

session (Better Auth)
├── id (String, @id)
├── userId (String, FK to user)
├── token (String, @unique)
└── expiry data

Admin (PATULOD)
├── id (String, @id, cuid)
├── fullName (String)
├── email (String, @unique)
├── userId (String, @unique, FK to user.id)
├── isActive (Boolean)
└── role (String: STAFF | MANAGER | SUPER_ADMIN)
```

### Authentication Flow

1. **Login (`/login`)**:
   - User enters email/password
   - `signIn.email()` from Better Auth client
   - Better Auth validates against `account.password`
   - Creates session in `session` table
   - Sets secure HTTP-only cookie
   - Redirects to `/dashboard`

2. **Protected Routes**:
   - `ProtectedRoute` component wraps protected pages
   - `useSession()` hook checks for valid session
   - If no session, redirects to `/login`
   - If session exists, renders page content

3. **Logout**:
   - `signOut()` from Better Auth client
   - Destroys session in database
   - Clears session cookie
   - Redirects to `/login`

### Key Files

- **`src/lib/auth.ts`** - Better Auth server configuration
- **`src/lib/auth-client.ts`** - Better Auth React client
- **`src/lib/auth-utils.ts`** - Server-side auth helpers
- **`src/lib/auth-middleware.tsx`** - Protected route wrapper
- **`src/routes/api/auth/$.ts`** - Auth API handler
- **`src/routes/login.tsx`** - Login page
- **`prisma/schema.prisma`** - Database schema
- **`prisma/seed.ts`** - Seed admin user

## Common Issues

### Issue: "DATABASE_URL is required"
**Solution:** Make sure `.env.local` has a valid `DATABASE_URL`

### Issue: "Prisma Client not generated"
**Solution:** Run `pnpm db:generate`

### Issue: Login returns error
**Solution:** 
1. Check database connection
2. Verify admin user exists: `pnpm db:studio`
3. Check console for errors
4. Verify `BETTER_AUTH_SECRET` is set

### Issue: Redirect loop on protected routes
**Solution:**
1. Clear browser cookies
2. Check that `BETTER_AUTH_URL` matches your dev server
3. Restart dev server

## Adding More Admin Users

Use Prisma Studio or create a signup endpoint:

```bash
pnpm db:studio
```

Or modify `prisma/seed.ts` to add more admin users and run:

```bash
pnpm db:seed
```

## Next Steps

1. ✅ Admin authentication working
2. ⏳ Add mobile user authentication (separate flow)
3. ⏳ Add role-based permissions
4. ⏳ Add password reset flow
5. ⏳ Add email verification (production)

## Production Considerations

Before going to production:

1. Enable email verification in `src/lib/auth.ts`
2. Set up proper email service (Resend)
3. Use strong `BETTER_AUTH_SECRET` (not the dev one)
4. Enable HTTPS
5. Set proper CORS policies
6. Add rate limiting on auth endpoints
7. Enable audit logging
8. Regular security audits
