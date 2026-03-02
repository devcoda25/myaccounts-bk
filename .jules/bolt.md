
## 2025-03-02 - Optimize DB Queries with Composite Indexes

**Learning:** When retrieving records filtered by a specific ID (like `userId` or `childId`) and sorted by a timestamp (like `createdAt` or `at`), PostgreSQL struggles to efficiently process the query without a composite index. It typically defaults to a sequential scan on the ID and an in-memory sort on the timestamp, which becomes very expensive as the dataset grows (e.g., thousands of sessions, notifications, etc. per user).

**Action:** Whenever a model has a common access pattern filtering by a parent ID and sorting by a timestamp, explicitly add a composite index such as `@@index([userId, createdAt])` to ensure rapid list fetching and sorting. This should be a standard practice for relations like sessions, logs, activities, and approvals in this codebase.
