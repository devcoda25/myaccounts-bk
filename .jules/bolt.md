## 2026-05-10 - Prisma Composite Indexes for Nested Includes
**Learning:** In this codebase, nested includes with order-by (like fetching ChildProfile and sorting activities by `at` desc) cause expensive in-memory filesorts if no composite index exists on the foreign key and the sort column.
**Action:** Always add composite indexes like `@@index([foreignKeyId, sortColumn])` when using Prisma `include` with `orderBy`.
