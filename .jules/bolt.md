## 2026-05-22 - Missing Composite Indexes on Chronological Queries
**Learning:** The application heavily relies on chronological queries filtering by foreign keys and ordering by timestamps. Without composite indexes, the database must perform expensive in-memory filesorts, becoming a significant bottleneck as tables scale.
**Action:** Always add composite indexes (e.g., `@@index([foreignKey, timestamp])`) when models are frequently accessed via `findMany` with an `orderBy` clause.
