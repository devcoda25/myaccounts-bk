## 2026-04-25 - [Database Indexes]
**Learning:** Prisma does not automatically index foreign keys or create compound indexes for sorting. Queries filtering by relation ID and sorting by timestamp cause expensive in-memory filesorts if not indexed.
**Action:** Always add composite indexes (e.g., `@@index([foreignKeyId, timestampColumn])`) for chronological access patterns.
