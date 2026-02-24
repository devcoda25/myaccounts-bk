## 2024-05-22 - Prisma Version Management
**Learning:** `npx prisma` defaults to the latest version (currently 7.x) which may have breaking changes. The project is locked to 6.19.1.
**Action:** Always run `npm install` first to ensure `npx prisma` uses the project's local version.

## 2024-05-22 - Lockfile Noise
**Learning:** `npm install` can introduce noise in `package-lock.json` due to environment differences.
**Action:** Always revert `package-lock.json` if no dependencies were intentionally added.
