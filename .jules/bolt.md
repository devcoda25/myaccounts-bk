## 2026-04-29 - Initializing Bolt Journal
**Learning:** Bolt environment initialized.
**Action:** Proceed with performance optimizations.
## 2026-04-29 - Missing DB Indexes causing In-Memory Sorts
**Learning:** Found several repos making queries that filter by an ID (e.g. childId, userId) and order by a timestamp (e.g. at, createdAt). Prisma will do in-memory filesorts for these if a composite index `@@index([idField, timestampField])` isn't present.
**Action:** Add composite indexes to Prisma models with this query pattern.
