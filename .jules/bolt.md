## 2025-02-27 - Session Index Optimization
**Learning:** The Session model is frequently queried by `userId` and filtered by `expiresAt`, but it lacks a composite index on `[userId, expiresAt(sort: Desc)]`.
**Action:** Add `@@index([userId, expiresAt(sort: Desc)])` to the Session model in `prisma/schema.prisma` to optimize session queries.
