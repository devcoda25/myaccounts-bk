## 2026-06-25 - Support Models Require Chronological Indexes
**Learning:** Models frequently queried by `userId` and sorted chronologically (e.g., `SupportTicket`, `SecurityReport`, `Notification`) lacked composite indexes like `@@index([userId, createdAt])`, causing expensive in-memory sorts.
**Action:** Add `@@index([userId, createdAt])` to these models to optimize `findMany` queries.
