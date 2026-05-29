## 2024-05-24 - [Adding index to ChildProfile model]
**Learning:** The `ChildProfile` model (mapped to `@@map("parental_child_profiles")`) relies on a composite index `@@index([parentId, createdAt])` to efficiently support its `findManyByParentId` query that filters by `parentId` and sorts by `createdAt` descending. Missing this index can cause performance issues (e.g. expensive in-memory sorts).
**Action:** When working on DB optimizations, review `findMany` queries in repos to identify missing indexes on large tables and add composite indexes where applicable.
