## 2026-05-06 - [Add composite indexes for parental models]
**Learning:** In Prisma with PostgreSQL, chronological query patterns filtering by a foreign key and sorting by a timestamp require composite indexes to avoid in-memory filesorts.
**Action:** Add composite indexes on foreign key and sort column to prevent expensive in-memory sorts.
