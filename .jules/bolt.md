## 2024-05-24 - Prisma + PostgreSQL Missing Foreign Key Indexes
**Learning:** Prisma does not automatically index foreign key columns or sort conditions in PostgreSQL. For common patterns like filtering by a user or child ID and sorting by a timestamp (e.g., `createdAt`), this leads to expensive in-memory sorts on large tables.
**Action:** Always check and manually add composite indexes (e.g., `@@index([userId, createdAt])`) in `prisma/schema.prisma` for models supporting list queries that filter by an owner and sort by time.
