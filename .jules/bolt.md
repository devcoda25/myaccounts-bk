## 2024-03-22 - [Prisma Composite Indexes for Filtering and Sorting]
**Learning:** When querying a database using a filter on one field and sorting on another (e.g., filtering by `childId` and sorting by `at`), the database often performs an expensive in-memory sort unless a composite index on `(filterField, sortField)` exists. Prisma doesn't automatically create these indexes.
**Action:** Always explicitly define composite indexes like `@@index([childId, at])` in `prisma/schema.prisma` for models accessed with this pattern to optimize performance.
