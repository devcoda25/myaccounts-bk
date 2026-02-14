## 2025-02-19 - [Missing FK Indexes in Prisma]
**Learning:** Prisma does not automatically add indexes for foreign keys (e.g., `userId`). This leads to full table scans on relations, which is a major performance bottleneck for large tables like `Notification` or `AuditLog`.
**Action:** Always manually add `@@index([foreignKey])` or composite indexes like `@@index([userId, createdAt])` for frequently accessed relations, especially when sorted by date.
