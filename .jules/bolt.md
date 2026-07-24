## 2026-07-24 - Add missing database indexes for performance
**Learning:** Identified frequently queried fields in NestJS applications using Prisma lacking composite indexes to optimize read operations when sorted chronologically.
**Action:** Add database indexes in `prisma/schema.prisma`.
