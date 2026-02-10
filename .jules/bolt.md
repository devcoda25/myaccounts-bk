## 2026-02-10 - [Missing Notification Index]
**Learning:** The `Notification` table had NO indexes (not even on `userId`), causing O(N) scans for every user notification fetch. Prisma does NOT auto-index foreign keys. `npx prisma generate` can silently upgrade dependencies if not pinned, polluting `package-lock.json`.
**Action:** Always manually audit schema for missing FK indexes. Pin `npx prisma@<version>` to match `package.json` to avoid lockfile churn.
