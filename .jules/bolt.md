## 2026-05-03 - Missing Composite Indexes Causes In-Memory Sorts
**Learning:** Chronological query patterns on relational data (e.g. `findManyByChildId` ordering by `at`) without composite indexes on the foreign key and sort column cause expensive in-memory sorts.
**Action:** Always add composite indexes (like `@@index([childId, at])` or `@@index([userId, createdAt])`) to models that support chronological access patterns.
