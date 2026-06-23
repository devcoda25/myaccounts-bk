## 2024-06-23 - Database Index Improvements
**Learning:** Prisma models that are frequently queried by `userId` and sorted by a date field (like `createdAt` or `lastUsedAt`) lack composite indexes, leading to potential performance bottlenecks as the application scales. The format tool `npx prisma@6.2.1 format` aggressively reformats unrelated parts of the schema file.
**Action:** Add targeted composite indexes directly using `sed` to avoid unnecessary whitespace and structure changes triggered by global format commands, preserving the original `schema.prisma` formatting where possible.
