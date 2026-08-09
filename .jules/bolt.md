## 2026-08-09 - Optimize sorting on descending date fields
**Learning:** Prisma querying by foreign key with a descending date sort implies a need for composite indexes (e.g., `@@index([userId, createdAt(sort: Desc)])`). Prisma generates ASC by default.
**Action:** Add `(sort: Desc)` in composite indexes for query optimization where findMany is used with a descending sort parameter.