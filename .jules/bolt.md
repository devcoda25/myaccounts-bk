## 2026-09-19 - [Database Query Optimization]
**Learning:** The application frequently queries `ChildProfile` by `parentId` sorting by `createdAt` descending, and `ParentalApproval`/`ParentalActivity` by `childId` sorting by `at` descending. Without composite indexes, these queries can cause expensive in-memory sorts on the database as tables grow.
**Action:** Add composite indexes with descending sort definitions in Prisma (e.g. `@@index([childId, at(sort: Desc)])`) to optimize findMany queries that require sorting, reducing query execution time and database load.
