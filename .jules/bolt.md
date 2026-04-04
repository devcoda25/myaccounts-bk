# Bolt's Journal

## 2024-05-22 - Initial Setup
**Learning:** The project is a NestJS application using Fastify and Prisma. It uses Argon2 for password hashing and has a custom OIDC adapter.
**Action:** Focus on Prisma queries and NestJS specific optimizations.

## 2024-05-22 - Missing Foreign Key Indexes
**Learning:** Prisma does not automatically index foreign keys. In a high-read application, this leads to sequential scans on relation lookups (e.g., `user.notifications`).
**Action:** Always verify `schema.prisma` has explicit `@@index` on FK columns used in filtering.
