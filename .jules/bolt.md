## 2024-05-24 - Missing Composite Indexes for Foreign Key + Timestamp Sorts
**Learning:** Prisma in PostgreSQL does not automatically index foreign keys, and chronological query patterns filtering by a foreign key and sorting by a timestamp result in expensive in-memory sorts.
**Action:** Add composite indexes to Prisma models when access patterns involve filtering by foreign key and sorting by time (e.g., `@@index([userId, createdAt])`).
