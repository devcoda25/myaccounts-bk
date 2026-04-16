## 2024-04-16 - Add missing composite indexes for sort optimization
**Learning:** Common backend pattern `findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })` causes an expensive in-memory filesort on PostgreSQL if a composite B-Tree index like `@@index([userId, createdAt])` is missing. Prisma does not automatically index foreign keys or composite query patterns.
**Action:** Always explicitly check for and add missing composite indexes (Foreign Key + Sort Column) in `prisma/schema.prisma` to prevent expensive in-memory filesorts for list endpoints.
