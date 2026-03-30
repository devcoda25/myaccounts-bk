
## 2024-05-30 - [Composite Indexes for Chronological Queries]
**Learning:** Chronological query patterns (e.g., sorting by `createdAt` or `lastUsedAt`) on tables that are filtered by a foreign key (e.g., `userId` or `childId`) require composite indexes to avoid expensive in-memory sorts in PostgreSQL.
**Action:** Always add composite indexes like `@@index([userId, createdAt])` for tables that are frequently queried by user ID and sorted chronologically.
