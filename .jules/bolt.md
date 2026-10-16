## 2026-10-16 - Notification Sorting Index Optimization
**Learning:** Models frequently queried by `userId` and sorted chronologically (like `Notification` via `findMany`) suffer from missing composite indexes in PostgreSQL, leading to in-memory sorts which degrades backend performance.
**Action:** Add `@@index([userId, createdAt(sort: Desc)])` to the `Notification` model to optimize `findMany` queries, avoiding expensive in-memory sorts.
