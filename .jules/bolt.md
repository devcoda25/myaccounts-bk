## 2025-02-12 - Notification Feed Optimization
**Learning:** The `Notification` model lacked an index on `userId` and `createdAt` despite being a high-traffic table frequently queried by users (feed). This is a critical performance bottleneck for large notification lists. The codebase has optimized indexes on `User` but missed them on related models.
**Action:** Always verify foreign key indexes and `orderBy` fields on core user-facing models like `Notification` and `AuditLog`.
