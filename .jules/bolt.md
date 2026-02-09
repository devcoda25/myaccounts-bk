## 2025-01-26 - [Missing Database Indexes]
**Learning:** Prisma does not automatically index foreign key columns (like `userId` in relations), leading to potential performance bottlenecks in relation lookups. This project was missing indexes on critical relations like `Notification.userId` and `ChildProfile.parentId`.
**Action:** Always check `prisma/schema.prisma` for missing `@@index` on foreign key columns, especially for high-traffic tables.
