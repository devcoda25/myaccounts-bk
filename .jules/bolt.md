## 2025-02-27 - [Prisma Index Optimization for Descending Sorts]
**Learning:** In PostgreSQL, queries combining equality filters (e.g., `childId = ?`) with ordering (e.g., `ORDER BY at DESC`) can suffer from performance degradation on large datasets if the index doesn't match the sort direction, requiring in-memory sorts. Prisma defaults to ASC unless specified.
**Action:** Added explicit `sort: Desc` to composite indexes (e.g., `@@index([childId, at(sort: Desc)])`) for `ParentalActivity` and `ParentalApproval` to allow the database to use the index directly for sorting.
