## 2024-05-20 - [Database Schema Indexes]
**Learning:** Prisma does not automatically index foreign key columns in PostgreSQL. Furthermore, common queries filter by a foreign key (like `userId` or `childId`) and sort by a timestamp (like `createdAt` or `at`). Without composite indexes, this results in expensive in-memory sorts and full table scans.
**Action:** Always check for and add composite indexes (e.g., `@@index([userId, createdAt])`) in `prisma/schema.prisma` to support filter+sort access patterns.
