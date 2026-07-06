## 2024-07-06 - Missing Composite Indexes for Chronological Sorting
**Learning:** The `ChildProfile`, `ParentalApproval`, and `ParentalActivity` models lacked composite indexes for their primary query patterns (filtering by foreign key and sorting by a timestamp like `createdAt` or `at`). This leads to expensive in-memory filesorts in the database.
**Action:** Always verify that models frequently queried by a parent ID and sorted chronologically have a composite index (e.g., `@@index([parentId, createdAt])`) to avoid database bottlenecks.
