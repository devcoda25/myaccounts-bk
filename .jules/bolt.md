## 2024-04-18 - Missing Composite Indexes for Chronological Queries
**Learning:** The application heavily relies on chronological sorts for related records (e.g., fetching a child's activities sorted by `at` DESC). Because Prisma does not automatically index foreign keys in PostgreSQL, these queries result in full table scans or expensive in-memory sorts (filesorts).
**Action:** Always add composite B-Tree indexes (e.g., `@@index([foreignKey, timestampField])`) to models that are frequently queried by relation and sorted chronologically.
