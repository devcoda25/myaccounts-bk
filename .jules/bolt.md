## 2026-05-15 - [Database Indexes]
**Learning:** Chronological queries using 'findMany' with sorting on timestamps require composite indexes matching the foreign key and sort column to prevent expensive in-memory filesorts.
**Action:** Add composite indexes (e.g. `@@index([userId, createdAt])`) to Prisma models that feature this access pattern.
