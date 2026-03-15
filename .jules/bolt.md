## 2024-03-15 - [Prisma Postgres Indexing]
**Learning:** Prisma does not automatically index foreign key columns (like `userId`) or frequently sorted columns in PostgreSQL.
**Action:** When optimizing, explicitly check for and add missing composite indexes on Foreign Keys and sort columns in `prisma/schema.prisma` (e.g., `@@index([userId, createdAt])`) to prevent expensive in-memory sorts and improve query performance.
