## 2026-06-05 - [Prisma Composite Indexes]
**Learning:** findMany queries filtering by a foreign key and ordering by a timestamp (like `childId` and `at`) rely heavily on composite indexes (e.g., `@@index([childId, at])`) to prevent expensive in-memory filesorts.
**Action:** Always add composite indexes matching the filter and sort fields for chronological query access patterns.
