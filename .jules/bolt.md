## 2025-02-18 - Prisma Version Mismatch & Missing Indexes
**Learning:** `npx prisma` defaults to the latest version (v7+) if not installed locally, causing schema validation errors due to breaking changes (e.g., `datasource url` deprecation). Also, Prisma does not automatically index foreign keys, leading to performance bottlenecks on relational queries.
**Action:** Always run `npm install` first to ensure the local `prisma` binary (v6.19.1) is used. Explicitly check for and add `@@index` on foreign keys and common sort columns (like `[userId, createdAt]`).
