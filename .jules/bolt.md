## 2024-05-24 - Composite Indexes for Scalable Sorting
**Learning:** Common queries involving filtering by a foreign key (like `userId` or `childId`) and sorting by a timestamp (like `createdAt` or `at`) can cause significant performance bottlenecks as the dataset grows, especially in PostgreSQL when relying only on single-column indexes.
**Action:** Always proactively add composite indexes (e.g., `@@index([userId, createdAt])` or `@@index([childId, at])`) to support these common access patterns and avoid expensive in-memory sorts.
