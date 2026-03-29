## 2024-03-29 - [Missing Database Indexes]
**Learning:** Database tables with `userId` or `childId` fields often lack indexes in this schema, causing expensive full-table scans when queried. Composite indexes (e.g., `[userId, createdAt]`) are frequently needed for models accessed in chronological order.
**Action:** When adding indexes, verify the fields actually exist in the schema to avoid fatal compilation errors.
