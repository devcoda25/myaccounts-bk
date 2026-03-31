## 2024-05-18 - Missing Composite Indexes on Chronological Data
**Learning:** The database schema is missing composite indexes for chronological filtering on some tables, leading to expensive in-memory sorts for common access patterns like `findManyByChildId` where we filter by `childId` and sort by `at` or `createdAt`.
**Action:** Add missing composite indexes in `prisma/schema.prisma` for models with these patterns, then regenerate the schema.
