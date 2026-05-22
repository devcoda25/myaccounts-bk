## 2024-05-22 - [Performance Optimization: Prisma Indexes]
**Learning:** Found potential performance issues in nested queries and finds due to missing composite database indexes on frequently queried combinations (e.g. `[parentId, createdAt]` for ChildProfile, `[childId, at]` for ParentalApproval and ParentalActivity, `[userId, lastUsedAt]` for Sessions, `[userId, createdAt]` for Notifications, SecurityReports, SupportTickets).
**Action:** Add the missing composite B-Tree indexes to `prisma/schema.prisma` to prevent expensive in-memory sorts and improve DB query times.
