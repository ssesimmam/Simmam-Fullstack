# 🎯 Setup Verification Checklist

Use this checklist to verify each phase completed successfully.

---

## ✅ Phase 1: Supabase Database Setup

### Prerequisites
- [ ] You have access to Supabase dashboard (https://supabase.com/dashboard)
- [ ] Your project ID is: `hpctlcwdqffrcyilqaro`

### Schema Installation
- [ ] Opened Supabase SQL Editor
- [ ] Created new query and pasted `supabase/schema_v2.sql`
- [ ] Query ran without errors
- [ ] Check console showed table creation messages

### Seed Data Installation
- [ ] Created new query for `supabase/seeds.sql`
- [ ] Query ran without errors
- [ ] Shows: `6 houses created` message

### Verification Steps

**Verify Tables Exist**:
```bash
# In Supabase, run this query:
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;

# You should see:
# - admins
# - announcements
# - checkins
# - events
# - houses
# - media
# - participants
# - points_history
# - registrations
# - users
```

Checkboxes:
- [ ] All 10 tables exist in Supabase editor
- [ ] `houses` table has 6 rows
- [ ] `events` table has at least 2 rows
- [ ] No errors when browsing tables

**Verify Views & Functions**:
```bash
# Run in Supabase SQL:
SELECT proname FROM pg_proc WHERE proname = 'create_registration';
# Should return: create_registration

SELECT viewname FROM pg_views WHERE schemaname = 'public';
# Should show: leaderboard
```

Checkboxes:
- [ ] `create_registration` function exists
- [ ] `leaderboard` view exists

### Phase 1 Status
- [ ] **All database tables created**
- [ ] **Seed data inserted**
- [ ] **Functions and views created**
- [ ] **Ready to move to Phase 2**

---

## ✅ Phase 2: Backend API Setup

### Prerequisites
- [ ] Node.js installed (`node --version` shows v18+)
- [ ] npm installed (`npm --version` shows v9+)

### Environment Setup
- [ ] Created `api/.env` file (copy from `api/.env.example`)
- [ ] Filled in `SUPABASE_URL` (from Supabase dashboard)
- [ ] Filled in `SUPABASE_ANON_KEY` (from Supabase dashboard)
- [ ] Filled in `SUPABASE_SERVICE_ROLE` (from Supabase dashboard - SECRET!)
- [ ] `PORT=4000` is set

### Dependencies Installation
```bash
cd api
npm install
```

Checkboxes:
- [ ] No errors during `npm install`
- [ ] `node_modules` folder created
- [ ] `package-lock.json` generated

### Start Backend Server
```bash
npm run dev
```

Expected output:
```
> api@1.0.0 dev
> ts-node-dev --respawn --transpile-only src/index.ts

[INFO] 10:30:45 ts-node-dev ver. 2.0.0
API server listening on http://localhost:4000
```

Checkboxes:
- [ ] Server started without errors
- [ ] Shows "API server listening on http://localhost:4000"
- [ ] Terminal is running (not exited)

### Test Backend Health
**In a new terminal** (don't stop the dev server):

```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{"ok":true,"now":"2026-05-17T10:30:45.123Z"}
```

Checkboxes:
- [ ] Response shows `"ok": true`
- [ ] Response includes `"now"` timestamp

### Test Events Endpoint
```bash
curl http://localhost:4000/api/events | jq 'length'
```

Expected:
- Shows a number (count of events, should be 2+ from seeds)

Checkboxes:
- [ ] Response is valid JSON
- [ ] Shows event count > 0
- [ ] Each event has `id`, `name`, `date`, `time_slot` fields

### Phase 2 Status
- [ ] **Backend server running on port 4000**
- [ ] **Health endpoint responds**
- [ ] **Events endpoint returns data**
- [ ] **Ready to move to Phase 3**

---

## ✅ Phase 3: Frontend Setup

### Prerequisites
- [ ] Frontend root folder has `vite.config.ts`
- [ ] You have `package.json` in root

### Environment Setup
- [ ] Created `.env.local` (copy from `.env.local.example`)
- [ ] Filled in `VITE_SUPABASE_URL`
- [ ] Filled in `VITE_SUPABASE_ANON_KEY`
- [ ] `.env.local` is in `.gitignore` (check it's listed)

### Vite Proxy Configuration

Edit `vite.config.ts` and ensure it has:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

Checkboxes:
- [ ] `vite.config.ts` has proxy config section
- [ ] Proxy target is `http://localhost:4000`
- [ ] No syntax errors in config file

### Dependencies Installation
```bash
npm install
```

Checkboxes:
- [ ] No errors during install
- [ ] `node_modules` folder created
- [ ] Takes ~1-2 minutes

### Start Frontend Server
**Keep the backend running! Start this in a NEW terminal:**

```bash
npm run dev
```

Expected output:
```
  VITE v7.3.1  ready in 543 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Checkboxes:
- [ ] Server started successfully
- [ ] Shows "Local:   http://localhost:5173/"
- [ ] No compilation errors

### Test Frontend Loads
Open browser: http://localhost:5173

Checkboxes:
- [ ] Page loads (don't worry about styling/data yet)
- [ ] No console errors (check DevTools → Console)
- [ ] Navigation menu appears

### Test Frontend → Backend Communication
In browser console (F12 → Console):

```javascript
fetch('/api/health').then(r => r.json()).then(d => console.log(d))
```

Expected output:
```
{ok: true, now: "2026-05-17T10:30:45.123Z"}
```

Checkboxes:
- [ ] Shows `{ok: true, ...}`
- [ ] No CORS errors in console
- [ ] Communication working

### Phase 3 Status
- [ ] **Frontend running on port 5173**
- [ ] **Page loads without errors**
- [ ] **Backend proxy configured**
- [ ] **Frontend ↔ Backend communication working**
- [ ] **Ready to move to Phase 4**

---

## ✅ Phase 4: Integration Testing

### Test 1: Get Events from Backend

**Via cURL**:
```bash
curl http://localhost:4000/api/events | jq '.[0]'
```

Should show an event object with fields like:
- `id` (uuid)
- `name` (string)
- `date` (YYYY-MM-DD)
- `time_slot` (HH:MM)

Checkboxes:
- [ ] Gets valid JSON response
- [ ] Shows at least 2 events (from seeds)
- [ ] Each event has required fields

**Via Browser**:
Open console and run:
```javascript
fetch('/api/events').then(r => r.json()).then(d => console.log(d[0]))
```

Checkboxes:
- [ ] Shows first event object
- [ ] No errors in console

### Test 2: Create Registration

**Get an event ID first**:
```bash
EVENT_ID=$(curl -s http://localhost:4000/api/events | jq -r '.[0].id')
echo $EVENT_ID
```

Checkboxes:
- [ ] Shows a UUID (long string)

**Create registration**:
```bash
curl -X POST http://localhost:4000/api/registrations \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"test.user@example.com",
    "name":"Test User",
    "register_number":"7376221CS001",
    "house":"Agniyas",
    "event_id":"'$EVENT_ID'"
  }'
```

Expected response:
```json
{
  "registration_id":"...",
  "ticket_code":"SMM-XXXXXXXX",
  "event_name":"...",
  "status":"confirmed",
  "registered_at":"..."
}
```

Checkboxes:
- [ ] Returns status 201 (Created)
- [ ] Shows `ticket_code` like "SMM-ABCD1234"
- [ ] Registration marked "confirmed"

### Test 3: Get User Dashboard

```bash
curl 'http://localhost:4000/api/users/test.user%40example.com/registrations' | jq
```

Expected response:
```json
{
  "user": {
    "id":"...",
    "email":"test.user@example.com",
    "name":"Test User",
    ...
  },
  "registrations": [
    {
      "event_id":"...",
      "event_name":"...",
      "ticket_code":"SMM-XXXXXXXX",
      ...
    }
  ]
}
```

Checkboxes:
- [ ] Shows user details
- [ ] Shows 1 registration (from Test 2)
- [ ] Ticket code matches Test 2 response

### Test 4: Duplicate Registration (Should Fail)

Try registering same user for same event again:

```bash
curl -X POST http://localhost:4000/api/registrations \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"test.user@example.com",
    "name":"Test User",
    "register_number":"7376221CS001",
    "house":"Agniyas",
    "event_id":"'$EVENT_ID'"
  }'
```

Expected:
- Status: `409 Conflict`
- Error message: "User already registered for this event"

Checkboxes:
- [ ] Returns 409 status
- [ ] Shows conflict error
- [ ] Proper error handling

### Test 5: Leaderboard in Database

In Supabase SQL editor:
```sql
SELECT * FROM leaderboard;
```

Should show 6 houses with their points.

Checkboxes:
- [ ] View returns all 6 houses
- [ ] Each house has `house_name`, `accent`, `total_points`
- [ ] Points are aggregated correctly

### Phase 4 Status
- [ ] **Events endpoint returns data**
- [ ] **Registration creation works**
- [ ] **Duplicate registrations properly rejected**
- [ ] **User dashboard shows registrations**
- [ ] **Leaderboard view working**
- [ ] **All integration tests passed**
- [ ] **READY FOR PRODUCTION** ✅

---

## 🎓 Phase 5: Frontend Integration (Optional)

This is for replacing localStorage with real API calls.

### Current State
The frontend still uses localStorage (mock data). These files need updates:
- `src/lib/registrationStore.ts` - Registration CRUD
- `src/lib/store.tsx` - Event/house data
- `src/components/AuthModal.tsx` - Registration form
- `src/components/MySchedule.tsx` - User dashboard

### What to Update
- Replace `localStorage.getItem()` with `fetch('/api/...')`
- Update event sources to use API endpoint
- Update registration form to POST to `/api/registrations`
- Update dashboard to fetch from `/api/users/:email/registrations`

### Verification After Update
- [ ] Register button works without localStorage
- [ ] Dashboard shows real registrations
- [ ] All data persists across page reloads
- [ ] No 404 or CORS errors

---

## 🚀 Phase 6: Production Deployment (Later)

### Backend on Railway
- [ ] Created Railway account
- [ ] Connected GitHub repository
- [ ] Set environment variables in Railway
- [ ] Backend URL working: `https://your-backend.up.railway.app/api/health`

### Frontend on Vercel
- [ ] Created Vercel project
- [ ] Set frontend environment variables
- [ ] Frontend deployed: `https://your-frontend.vercel.app`
- [ ] API URL configured for production

### Domain Setup (Optional)
- [ ] Custom domain pointing to Vercel frontend
- [ ] Cloudflare configured
- [ ] HTTPS working

---

## 📊 Summary Table

| Phase | Component | Status | Next Action |
|-------|-----------|--------|-------------|
| 1 | Supabase Database | ✅ | Run Phase 2 |
| 2 | Backend API | ✅ | Run Phase 3 |
| 3 | Frontend Dev | ✅ | Run Phase 4 |
| 4 | Integration Tests | ✅ | Start Phase 5 (optional) |
| 5 | Frontend Integration | ⏳ | Update components |
| 6 | Production Deploy | ⏳ | After Phase 5 |

---

## 🆘 Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| "Cannot find module" in api/ | Run `npm install` in api folder |
| "SUPABASE_URL is undefined" | Check `api/.env` file has correct values |
| Frontend shows empty events | Backend not running, or proxy not configured |
| "CORS error" in browser | Check Vite proxy in `vite.config.ts` |
| Registration returns 404 | Event UUID is wrong, verify with `GET /api/events` |
| Duplicate registration fails | This is expected! User can't register twice for same event |
| "Connection refused" to backend | Backend not running on port 4000 |

---

## ✨ You're Done When:

1. ✅ All 3 services running (Backend, Frontend, Supabase)
2. ✅ Phase 4 tests all pass
3. ✅ User can register and see dashboard
4. ✅ No console errors
5. ✅ Data persists in database

**Estimated Time**: 1 hour for Phases 1-4

---

Need help? Check:
1. [GETTING_STARTED.md](GETTING_STARTED.md) - Step-by-step guide
2. [API_REFERENCE.md](API_REFERENCE.md) - All endpoints with examples
3. [DATABASE_FLOW.md](DATABASE_FLOW.md) - Data structure and queries
4. [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Credential setup

**Good luck! 🎉**
