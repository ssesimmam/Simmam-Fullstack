# 🚀 SIMMAM Full Stack Setup - Complete Checklist

## Status: All scaffolding completed ✅

You have:
- ✅ Backend API scaffold (Express + TypeScript + Supabase)
- ✅ Supabase schema with tables, indexes, functions, views
- ✅ Documentation for data flow and queries
- ✅ Environment variable templates

---

## Phase 1: Supabase Database Setup (Do This First)

### Step 1.1: Create/Verify Supabase Project

You already have a project:
- **Project URL**: https://supabase.com/dashboard/project/hpctlcwdqffrcyilqaro/settings/api-keys
- **Your Project ID**: `hpctlcwdqffrcyilqaro`

### Step 1.2: Copy Credentials from Dashboard

1. Go to: https://supabase.com/dashboard/project/hpctlcwdqffrcyilqaro/settings/api-keys
2. Copy **Project URL** (e.g., `https://hpctlcwdqffrcyilqaro.supabase.co`)
3. Copy **Anon Key** (public, starts with `eyJ...`)
4. Copy **Service Role Key** (secret, starts with `eyJ...`)

### Step 1.3: Run Database Schema

1. Go to: https://supabase.com/dashboard/project/hpctlcwdqffrcyilqaro/sql
2. Click **New Query**
3. Copy-paste entire contents of `supabase/schema_v2.sql` (from this repo)
4. Click **Run**
5. Check for success (no errors)

### Step 1.4: Seed Initial Data

1. In the same SQL editor, click **New Query**
2. Copy-paste contents of `supabase/seeds.sql`
3. Click **Run**
4. You now have 6 houses and 2 sample events

### Step 1.5: Verify Tables Exist

1. Go to: https://supabase.com/dashboard/project/hpctlcwdqffrcyilqaro/editor
2. You should see these tables in the left sidebar:
   - users
   - houses
   - events
   - registrations
   - participants
   - checkins
   - points_history
   - announcements
   - media

✅ **Phase 1 Complete**: Database is ready

---

## Phase 2: Backend API Setup (Local Development)

### Step 2.1: Set Up Environment

**In the `api/` folder:**

1. Copy `.env.example` → `.env`:
   ```bash
   cd api
   cp .env.example .env
   ```

2. Edit `api/.env` and fill in your credentials from Step 1.2:
   ```env
   SUPABASE_URL=https://hpctlcwdqffrcyilqaro.supabase.co
   SUPABASE_SERVICE_ROLE=<paste-service-role-key>
   SUPABASE_ANON_KEY=<paste-anon-key>
   PORT=4000
   ```

### Step 2.2: Install Dependencies

```bash
cd api
npm install
```

### Step 2.3: Start Backend Server

```bash
npm run dev
```

You should see:
```
API server listening on http://localhost:4000
```

### Step 2.4: Test Backend Health

In a new terminal:
```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{"ok":true,"now":"2026-05-17T..."}
```

✅ **Phase 2 Complete**: Backend is running

---

## Phase 3: Frontend Setup

### Step 3.1: Set Up Frontend Environment

**In the root folder:**

1. Copy `.env.local.example` → `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in credentials:
   ```env
   VITE_SUPABASE_URL=https://hpctlcwdqffrcyilqaro.supabase.co
   VITE_SUPABASE_ANON_KEY=<paste-anon-key>
   ```

### Step 3.2: Add Vite Proxy

Edit `vite.config.ts` and add this inside the `defineConfig` call (merge with existing config):

```ts
export default defineConfig({
  // ... existing config ...
  vite: {
    // ... existing vite config ...
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
});
```

### Step 3.3: Install Dependencies

```bash
npm install
```

### Step 3.4: Start Frontend

```bash
npm run dev
```

You should see Vite output with the local URL (e.g., `http://localhost:5173`)

✅ **Phase 3 Complete**: Frontend is running

---

## Phase 4: Test Full Integration

### Test 1: Create a Registration

```bash
curl -X POST http://localhost:4000/api/registrations \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"student1@example.com",
    "name":"Student One",
    "register_number":"7376221CS001",
    "house":"Agniyas",
    "event_id":"<event-uuid>"
  }'
```

To get an event UUID:
```bash
curl http://localhost:4000/api/events | jq '.[0].id'
```

### Test 2: Get User Registrations

```bash
curl http://localhost:4000/api/users/student1%40example.com/registrations
```

### Test 3: Check Dashboard

1. Open http://localhost:5173 in browser
2. Navigate to `/register` or `/events`
3. Try registering for an event (will use localStorage until frontend is updated)

✅ **Phase 4 Complete**: Integration tested

---

## Phase 5: Frontend Integration (Optional - Update Components)

To make the frontend use the real backend instead of localStorage:

### Replace in `src/lib/registrationStore.ts`:

```ts
// OLD: Uses localStorage
export function registerForEvent(email, event) {
  const registrations = getUserRegistrations(email);
  // ... localStorage logic ...
}

// NEW: Uses backend API
export async function registerForEvent(email, event) {
  const res = await fetch('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name: event.name,
      register_number: 'TBD',
      house: 'TBD',
      event_id: event.eventId
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

This requires updating multiple components. Full integration can be done in Phase 6.

---

## Phase 6: Production Deployment (After Testing)

### Supabase
- Keep as-is (managed service)

### Backend → Railway
1. Push `api/` folder to GitHub
2. Create new Railway project
3. Connect Git repo
4. Set environment variables in Railway dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE`
   - `SUPABASE_ANON_KEY`
   - `PORT` (Railway default)

### Frontend → Vercel
1. Push repo to GitHub
2. Create new Vercel project
3. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | Detailed Supabase credential guide |
| [DATABASE_FLOW.md](DATABASE_FLOW.md) | Data flow diagrams and SQL queries |
| [api/README.md](api/README.md) | Backend setup instructions |
| [api/.env.example](api/.env.example) | Backend env template |
| [.env.local.example](.env.local.example) | Frontend env template |
| [supabase/schema_v2.sql](supabase/schema_v2.sql) | Database schema to run |
| [supabase/seeds.sql](supabase/seeds.sql) | Initial data seeds |

---

## Troubleshooting

### "SUPABASE_URL is undefined"
- Check `api/.env` has correct values
- Restart `npm run dev` in api folder

### "Registrations endpoint 404"
- Ensure backend is running: `curl http://localhost:4000/api/health`
- Check proxy in `vite.config.ts` is configured

### "Unique constraint violation" on registration
- User already registered for that event
- Expected behavior (error handling)

### "Database connection error"
- Verify SUPABASE_SERVICE_ROLE is correct (very long string)
- Check Supabase project is active

---

## Next Steps

1. **Complete Phase 1-3** (Supabase setup, start backend + frontend)
2. **Run Phase 4 tests** (verify integration)
3. **Share feedback** on what works/breaks
4. **I can help with**: 
   - Full frontend integration (replace components)
   - Admin endpoints and RBAC
   - Unit tests
   - Deployment config

---

**You're ready to start! Begin with Phase 1 and let me know any issues.** 🎉
