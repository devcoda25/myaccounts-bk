# Bolt's Journal

## 2024-05-18 - Missing Composite Indexes for Chronological Queries
**Learning:** Found that multiple models (`Notification`, `SecurityReport`, `SupportTicket`, `Session`) had single-column indexes but lacked composite indexes for common foreign-key + chronological sort patterns (e.g., filtering by `userId` and sorting by `createdAt` or `lastUsedAt`). This results in expensive in-memory sorts (filesorts).
**Action:** Always verify if a model has `orderBy` queries associated with a specific relation field. If so, add a composite index like `@@index([userId, createdAt])` to naturally support the `ORDER BY ... DESC` query.
