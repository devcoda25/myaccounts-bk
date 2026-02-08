## 2025-02-18 - [Prisma Index Optimization]
**Learning:** Verified that adding indexes to foreign keys (`userId`, `parentId`, `childId`) in `prisma/schema.prisma` is a safe and high-impact optimization for this codebase, as many relations (like `Notification`, `ChildProfile`) are queried frequently by these keys but lacked explicit indexes.
**Action:** Always check `prisma/schema.prisma` for missing indexes on relation fields, especially for high-volume tables like `Notification` or `AuditLog`.
