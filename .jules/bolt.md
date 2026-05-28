## 2024-05-18 - [Prisma Chronological Indexes]
**Learning:** Chronological query patterns without composite indexes cause expensive in-memory sorts.
**Action:** Add composite indexes on foreign keys and chronological sorting columns (e.g., `@@index([userId, createdAt])`).
