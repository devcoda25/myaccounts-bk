## 2025-02-18 - [Prisma Foreign Key Indexing]
**Learning:** Prisma does not automatically index foreign key columns defined in `@relation`. In this codebase, the `Notification` model was missing an index on `userId`, causing inefficient lookups when filtering by user and sorting by date.
**Action:** Always manually verify that foreign keys used in filtering/sorting have appropriate `@@index` or `@@unique` definitions in `schema.prisma`. Specifically check for `@@index([userId, createdAt])` pattern for user-centric lists.
