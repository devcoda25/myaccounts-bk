## 2025-01-27 - [Prisma Foreign Key Indexing]
**Learning:** Prisma does NOT automatically index foreign key columns (like `userId` in `Notification`). Queries filtering by these keys without an index result in full table scans, which is a major bottleneck for user-centric data.
**Action:** Always verify if foreign keys in `schema.prisma` have accompanying `@@index` definitions, especially for high-volume tables like Notifications, Logs, or Sessions.
