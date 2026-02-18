## 2024-05-23 - [Missing Indexes on High-Volume Tables]
**Learning:** The codebase relies on Prisma but lacks manual indexes on foreign keys and frequently sorted columns (e.g., `Notification.userId`, `Notification.createdAt`). Prisma does not add these automatically.
**Action:** Always check `prisma/schema.prisma` for missing `@@index` on foreign keys and sort columns when optimizing query performance.
