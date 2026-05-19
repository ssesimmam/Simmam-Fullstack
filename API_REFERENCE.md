# API Reference Guide

## Base URL

**Local Development**: `http://localhost:4000`  
**Production**: `https://your-railway-backend.up.railway.app` (after deployment)

All endpoints prefixed with `/api`

---

## Current Available Endpoints

### 1. Health Check

```http
GET /api/health
```

**Purpose**: Verify backend is running

**Response (200)**:
```json
{
  "ok": true,
  "now": "2026-05-17T10:30:45.123Z"
}
```

**Usage**:
```bash
curl http://localhost:4000/api/health
```

---

### 2. List All Events

```http
GET /api/events
```

**Purpose**: Get all events for homepage/filtering

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by: "Tech", "Non-Tech", "Dance", "Music", "Theatre" |
| date | YYYY-MM-DD | No | Filter events on specific date |

**Response (200)**:
```json
[
  {
    "id": "uuid-here",
    "name": "Competitive Coding",
    "category": "Technical",
    "main_category": "Tech",
    "description": "Solve coding problems",
    "date": "2026-05-24",
    "time_slot": "12:00",
    "end_time": "13:30",
    "registration_open": true,
    "is_floated": true,
    "capacity": null,
    "status": "active",
    "venue": null,
    "created_at": "2026-05-16T10:00:00Z"
  },
  ...
]
```

**Usage**:
```bash
# Get all events
curl http://localhost:4000/api/events

# Get tech events only
curl 'http://localhost:4000/api/events?category=Tech'

# Get events on specific date
curl 'http://localhost:4000/api/events?date=2026-05-24'

# Both filters
curl 'http://localhost:4000/api/events?category=Tech&date=2026-05-24'
```

---

### 3. Create Registration

```http
POST /api/registrations
```

**Purpose**: Register a user for an event

**Request Body**:
```json
{
  "email": "student@example.com",
  "name": "Student Name",
  "register_number": "7376221CS001",
  "house": "Agniyas",
  "event_id": "uuid-of-event"
}
```

**Response (201)**:
```json
{
  "registration_id": "uuid-here",
  "ticket_code": "SMM-A1B2C3D4",
  "event_name": "Competitive Coding",
  "status": "confirmed",
  "registered_at": "2026-05-17T10:30:00Z"
}
```

**Error Responses**:
- `400` - Missing required fields
- `404` - Event not found
- `409` - User already registered for this event
- `500` - Database error

**Usage**:
```bash
curl -X POST http://localhost:4000/api/registrations \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "student1@example.com",
    "name": "Student One",
    "register_number": "7376221CS001",
    "house": "Agniyas",
    "event_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

### 4. Get User Registrations

```http
GET /api/users/:email/registrations
```

**Purpose**: Get all registrations for a user (for dashboard)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | User email (URL encoded) |

**Response (200)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "student1@example.com",
    "name": "Student One",
    "house": "Agniyas",
    "register_number": "7376221CS001"
  },
  "registrations": [
    {
      "registration_id": "uuid",
      "event_id": "uuid",
      "event_name": "Competitive Coding",
      "category": "Technical",
      "date": "2026-05-24",
      "time_slot": "12:00",
      "end_time": "13:30",
      "ticket_code": "SMM-A1B2C3D4",
      "status": "confirmed",
      "registered_at": "2026-05-17T10:30:00Z",
      "venue": null
    },
    ...
  ]
}
```

**Error Responses**:
- `404` - User not found
- `500` - Database error

**Usage**:
```bash
# Note: @ must be URL encoded as %40
curl 'http://localhost:4000/api/users/student1%40example.com/registrations'

# In Postman: just use student1@example.com, Postman auto-encodes
```

---

## Planned Endpoints (Not Yet Implemented)

### 5. Admin: Check-in User (To Come)

```http
POST /api/admin/checkin
```

**Request Body**:
```json
{
  "registration_id": "uuid",
  "admin_id": "uuid",
  "device_info": "iPad Pro"
}
```

---

### 6. Admin: Award Points (To Come)

```http
POST /api/admin/points
```

**Request Body**:
```json
{
  "house_id": "uuid",
  "points": 50,
  "reason": "Won Coding Competition",
  "issued_by": "admin-uuid"
}
```

---

### 7. Admin: Event CRUD (To Come)

```http
GET    /api/admin/events
POST   /api/admin/events
PUT    /api/admin/events/:event_id
DELETE /api/admin/events/:event_id
```

---

### 8. Leaderboard (To Come)

```http
GET /api/leaderboard
```

**Response**:
```json
[
  {
    "house_id": "uuid",
    "house_name": "Agniyas",
    "accent": "#FF6B6B",
    "total_points": 250
  },
  ...
]
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": "Additional context if available"
}
```

**Common Error Codes**:
- `MISSING_FIELDS` - Required field missing in request
- `NOT_FOUND` - Resource doesn't exist
- `DUPLICATE_REGISTRATION` - User already registered
- `DATABASE_ERROR` - Backend database issue
- `INTERNAL_ERROR` - Unexpected server error

---

## Frontend Integration Examples

### Register User

```javascript
async function registerForEvent(formData) {
  const res = await fetch('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error);
  }
  
  return res.json();
}

// Usage
try {
  const registration = await registerForEvent({
    email: 'student@example.com',
    name: 'Student Name',
    register_number: '7376221CS001',
    house: 'Agniyas',
    event_id: eventId
  });
  console.log('Ticket:', registration.ticket_code);
} catch (error) {
  console.error('Registration failed:', error.message);
}
```

### Fetch Events

```javascript
async function getEvents(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`/api/events?${params}`);
  return res.json();
}

// Usage
const techEvents = await getEvents({ category: 'Tech' });
const mayEvents = await getEvents({ date: '2026-05-24' });
```

### Get User Dashboard

```javascript
async function getUserDashboard(email) {
  const encodedEmail = encodeURIComponent(email);
  const res = await fetch(`/api/users/${encodedEmail}/registrations`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch registrations');
  }
  
  return res.json();
}

// Usage
const dashboard = await getUserDashboard('student@example.com');
console.log('Registrations:', dashboard.registrations);
```

---

## Testing with cURL

### Create Sample Registration

```bash
# First, get an event ID
EVENT_ID=$(curl -s http://localhost:4000/api/events | jq -r '.[0].id')

# Then register
curl -X POST http://localhost:4000/api/registrations \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"test@example.com\",
    \"name\": \"Test User\",
    \"register_number\": \"7376221CS001\",
    \"house\": \"Agniyas\",
    \"event_id\": \"$EVENT_ID\"
  }"
```

### Verify Registration in Dashboard

```bash
curl 'http://localhost:4000/api/users/test%40example.com/registrations' | jq
```

### Test Error Case (Duplicate Registration)

```bash
# Try registering same user for same event again
# Should get 409 Conflict error
```

---

## CORS Policy

The backend allows requests from:
- `http://localhost:5173` (local development)
- `http://localhost:3000` (alternative port)
- `*` (production - configure based on frontend domain)

To test CORS locally, the Vite proxy handles it automatically.

---

## Rate Limiting

Currently: **No rate limiting** (add in production)

Recommended for production:
- Registrations: 5 per minute per email
- Events: 100 per minute per IP
- Check-in: 30 per minute per admin

---

## Authentication

Currently: **No authentication** (add for production)

For production add:
- JWT tokens for admins
- RBAC (Role-Based Access Control)
- Supabase RLS policies

---

## Database Queries Behind Endpoints

### GET /api/events
```sql
SELECT * FROM events 
WHERE ($1::text IS NULL OR category = $1)
  AND ($2::date IS NULL OR date::date = $2)
ORDER BY date, time_slot;
```

### POST /api/registrations
```sql
SELECT create_registration(
  $1::text,  -- email
  $2::text,  -- name
  $3::text,  -- register_number
  $4::text,  -- house
  $5::uuid   -- event_id
);
```

### GET /api/users/:email/registrations
```sql
SELECT u.*, r.registration_id, r.event_id, e.name, e.category, e.date, e.time_slot, e.end_time, e.venue, r.ticket_code, r.status, r.registered_at
FROM users u
LEFT JOIN registrations r ON u.id = r.user_id
LEFT JOIN events e ON r.event_id = e.id
WHERE u.email = $1::text
ORDER BY e.date, e.time_slot;
```

---

## Deployment Notes

### Environment Variables Required

In production (Railway/Vercel):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=<very-long-secret-key>
SUPABASE_ANON_KEY=<long-public-key>
PORT=4000 (Railway default)
```

### Backend Health Check URL

For Railway health monitoring:
```
http://<your-backend>.up.railway.app/api/health
```

### Frontend Proxy

For Vercel, use environment variable:
```
VITE_API_URL=https://your-backend.up.railway.app
```

And update fetch calls:
```javascript
const API_URL = import.meta.env.VITE_API_URL || '/api';
fetch(`${API_URL}/registrations`, ...)
```

---

## Quick Status Check

```bash
# Verify everything is running
echo "Backend health:" && curl http://localhost:4000/api/health
echo "\nEvents count:" && curl http://localhost:4000/api/events | jq 'length'
echo "\nDatabase status:" && curl -s http://localhost:4000/api/events | jq '.[0] | keys'
```

---

**Last Updated**: 2026-05-17  
**API Version**: 1.0 (Beta)  
**Status**: Ready for integration testing

For full database schema and data flow: see [DATABASE_FLOW.md](DATABASE_FLOW.md)
