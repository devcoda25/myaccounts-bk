## 2025-02-21 - [Missing Foreign Key Indexes in Prisma]
**Learning:** This NestJS/Prisma project relies heavily on relational lookups (e.g., `Notification` to `User`), but Prisma does not automatically index foreign keys in PostgreSQL. This creates implicit performance bottlenecks for filtering and cascading deletes.
**Action:** When working with Prisma schemas, always explicitly check for and add `@@index` on foreign key columns and frequently used composite sort keys (e.g., `[userId, createdAt]`).
