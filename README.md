# Backend API

A production-grade multi-tenant REST API with rate limiting, queue-based email engine, and tamper-evident audit trail.

---

## Tech Stack

| Component | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Cache / Queue | Redis + Bull |
| Email | Nodemailer (Ethereal SMTP) |
| Testing | Jest + ts-jest |

---

## Local Setup

### Prerequisites
- Node.js v18+
- Docker Desktop (for Redis)
- PostgreSQL (Supabase or local)

### Steps

**1. Clone the repository:**
```bash
git clone <your-repo-url>
cd backend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Setup environment variables — create `.env`:**
```env
PORT=8000
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
INTERNAL_API_KEY="your-internal-key"
```

**4. Start Redis:**
```bash
docker run --name redis -p 6379:6379 -d redis
```

**5. Setup database:**
```bash
npx prisma db push
npx prisma generate
```

**6. Seed database:**
```bash
npm run seed
```

**7. Start server:**
```bash
npm run dev
```

---

## API Endpoints

### Public
| Method | Endpoint | Description |
|---|---|---|
| POST | /tenants | Create tenant |
| POST | /api-keys | Create API key |

### Protected (x-api-key header required)
| Method | Endpoint | Description |
|---|---|---|
| GET | /users | Get all users |
| POST | /users | Create user (OWNER only) |
| GET | /audit | Get audit logs |
| GET | /audit/verify | Verify audit chain |

### Internal (x-internal-key header required)
| Method | Endpoint | Description |
|---|---|---|
| GET | /health | System health |
| GET | /metrics | Usage metrics |

---

## Architectural Decisions

### 1. Framework — Express
Express chosen over Fastify because:
- Wider ecosystem and middleware support
- Better TypeScript community support
- Sufficient performance for this use case

### 2. Multi-Tenant Isolation
Tenant isolation is enforced at **query level**, not just middleware:
- Every API key is linked to a tenant in the database
- `authMiddleware` resolves tenant from API key on every request
- All database queries use `tenantId` from `req.tenant` — never from user input
- A user from Tenant A physically cannot query Tenant B's data

### 3. Sliding Window Rate Limiting
Three-tier rate limiting using Redis sorted sets:
- Each request is stored as a timestamped entry in a Redis sorted set
- On each request, entries older than the window are removed
- Current count is computed from remaining entries
- This ensures accurate counting at window boundaries unlike fixed window

### 4. Audit Chain Mechanism
SHA-256 chain hashing:
- Each entry's hash = SHA256(entry content + previous entry hash)
- First entry uses `0000000000000000` as previous hash
- Content is normalized (sorted keys) before hashing to ensure consistency
- Tampering any entry breaks all subsequent hashes
- `GET /audit/verify` recomputes entire chain and detects tampering

### 5. Queue-Based Email
Bull (Redis-backed) chosen because:
- Redis already in use for rate limiting
- Built-in retry with exponential backoff
- Dead letter queue support
- Job persistence across restarts

---

## Sliding Window Implementation

```typescript
const slidingWindow = async (key, limit, windowSeconds) => {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  
  // Remove old entries outside window
  await redis.zremrangebyscore(key, 0, windowStart);
  
  // Count current entries
  const current = await redis.zcard(key);
  
  // Add current request
  await redis.zadd(key, now, `${now}-${random}`);
  
  return { allowed: current < limit, current };
};
```

---

## Known Limitations

- API key verification loops through all active keys (O(n)) — should use indexed lookup in production
- Email transporter creates new Ethereal account on every email — should be singleton in production
- No refresh token system — API keys are long-lived
- Metrics endpoint uses audit logs as proxy for request count — dedicated metrics store recommended for production

---

## Running Tests

```bash
# Start Redis first
docker start redis

# Run tests
npm test
```