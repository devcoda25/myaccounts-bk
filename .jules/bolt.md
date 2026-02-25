## 2025-02-18 - [Prisma Version Mismatch]
**Learning:** The project uses Prisma v6, but `npx prisma` defaults to v7+, which breaks schema validation due to deprecated `url` property.
**Action:** Always run `npm install` first to ensure `npx prisma` uses the local v6 binary, or explicitly use `npx prisma@6`.
