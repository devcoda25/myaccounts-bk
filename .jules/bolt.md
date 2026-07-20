## 2026-07-20 - [Database Index Optimization]
**Learning:** Missing composite indexes on frequently queried fields like childId sorted by date can cause performance bottlenecks in database lookups.
**Action:** Add composite indexes using Prisma to optimize findMany queries with sorting.
