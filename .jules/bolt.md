## 2025-04-08 - [Missing Indexes on Parental Models]
**Learning:** Common access patterns in `findManyByChildId` queries on `ParentalApproval` and `ParentalActivity` models rely on filtering by `childId` and sorting by `at` desc. The lack of composite indexes `@@index([childId, at])` results in expensive in-memory sorts for PostgreSQL databases.
**Action:** Always check `schema.prisma` for missing composite indexes when encountering chronological queries filtered by a foreign key, and add `@@index([foreignKey, sortColumn])` to optimize performance.
