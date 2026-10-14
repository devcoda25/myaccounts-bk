## 2025-02-28 - Added Composite Index on Notification Model
**Learning:** Models frequently queried by `userId` and sorted chronologically (e.g., `Notification`) require composite indexes like `@@index([userId, createdAt(sort: Desc)])` to optimize findMany queries and avoid expensive in-memory sorts.
**Action:** Always check if a frequently queried table with sorting requirements has the appropriate composite index covering both the filter and the sort fields.
