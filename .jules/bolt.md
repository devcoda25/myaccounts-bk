## 2025-02-27 - [Chronological Sort Indexes]
**Learning:** Frequent findMany queries by `userId` sorted by `createdAt` in chronologically-ordered models (like Notification) require composite indexes with explicit `(sort: Desc)` to avoid expensive in-memory sorts and schema drift in PostgreSQL.
**Action:** Always define composite indexes as `@@index([userId, createdAt(sort: Desc)])` for models tracking chronological events by user.
