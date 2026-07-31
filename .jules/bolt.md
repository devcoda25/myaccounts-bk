## 2025-02-27 - Bolt Database Query Optimizations
**Learning:** Several high-volume queries sorting by date (findManyByParentId, findManyByChildId, Session queries, SecurityReport queries, findUserTickets) were missing composite indexes covering both the foreign key and the sort field, leading to potential performance bottlenecks as tables grow.
**Action:** Added targeted composite indexes (e.g. `@@index([userId, createdAt])`) in `prisma/schema.prisma` to offload the sorting workload to the database and speed up reads.
