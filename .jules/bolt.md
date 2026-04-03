# Bolt's Journal

## 2024-05-15 - Missing composite indexes for chronological queries
**Learning:** Common backend query access patterns (like `findManyByParentId` or `findManyByChildId`) filter by a foreign key and sort by a timestamp (e.g., `createdAt` or `at` DESC). Without composite indexes covering these fields, the database performs expensive in-memory filesorts on the result set. Prisma does not automatically generate foreign key indexes, much less composite sorting indexes.
**Action:** Always verify the standard access patterns in repository `findMany...` methods. When filtering by ID and sorting by Date, explicitly add `@@index([idField, dateField])` to the Prisma schema to ensure optimal performance.
