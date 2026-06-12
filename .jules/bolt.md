## 2024-06-12 - [Bolt: Prisma Nested Include Composite Index Optimization]
**Learning:** Prisma nested includes with chronological ordering (e.g. `findManyByParentId` and `findManyByChildId`) heavily rely on composite indexes matching the foreign key and sort column to avoid in-memory sorts.
**Action:** Added composite indexes like `@@index([parentId, createdAt])` and `@@index([childId, at])` to the relevant models to optimize these queries.
