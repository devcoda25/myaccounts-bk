## 2025-01-28 - Prisma Validation Requirements
**Learning:** `npx prisma validate` and `npx prisma generate` require `DATABASE_URL` to be present in the environment or `.env` file, even if the database is not actually being connected to.
**Action:** Always create a dummy `.env` with `DATABASE_URL` before running Prisma CLI commands in CI/CD or local test environments if one doesn't exist.

## 2025-01-28 - Prisma Formatting Noise
**Learning:** `npx prisma format` reorders and reformats the entire schema file, which can lead to large diffs even for small changes.
**Action:** Be prepared for large diffs when modifying `schema.prisma` and ensure comments are preserved and placed correctly to avoid them being moved unexpectedly.
