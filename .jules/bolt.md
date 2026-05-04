## 2026-05-04 - Prevent in-memory filesorts with composite indexes
**Learning:** Chronological queries filtering by a foreign key (e.g., childId) and sorting by a timestamp (e.g., at) cause expensive in-memory filesorts in PostgreSQL if no matching index exists.
**Action:** Always check the Prisma schema for frequently queried relation/sort combinations and add composite indexes (e.g., `@@index([childId, at])`) to improve performance.
