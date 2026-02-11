## 2025-02-11 - Missing Index on Notification
**Learning:** The `Notification` model lacked an index on `userId`, causing slow lookups for user notifications which are frequently accessed. Additionally, sorting by `createdAt` was unoptimized.
**Action:** Added `@@index([userId, createdAt])` to `Notification` model to optimize `WHERE userId = ? ORDER BY createdAt DESC` queries. Always verify foreign key indexes in Prisma schema as they are not created automatically for Postgres.

## 2025-02-11 - ESLint 9 Configuration
**Learning:** The project uses ESLint 9 but lacked `eslint.config.js`, causing `npm run lint` to fail.
**Action:** Created `eslint.config.js` using `FlatCompat` to extend legacy configs and ensure linting works. Always check for `eslint.config.js` when upgrading to ESLint 9+.
