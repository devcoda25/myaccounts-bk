## 2026-07-02 - Add composite indexes for user chronological queries
**Learning:** Models frequently queried by `userId` and sorted chronologically (e.g., `Notification`, `SecurityReport`, `SupportTicket`, `Session`) require composite indexes like `@@index([userId, createdAt])` or `@@index([userId, lastUsedAt])` to optimize `findMany` queries and avoid expensive in-memory sorts.
**Action:** Always add composite indexes covering both the foreign key and the timestamp field when sorting by time on a related entity list.
