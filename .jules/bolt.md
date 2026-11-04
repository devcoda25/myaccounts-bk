## 2024-10-28 - N+1 Query in Array Iterations
**Learning:** Found multiple instances where Prisma delete operations are executed inside loops over collections fetched via findMany, causing N+1 query problems.
**Action:** Use Prisma's deleteMany to perform bulk deletions in a single database operation instead of iterating and deleting individually, significantly improving database performance.