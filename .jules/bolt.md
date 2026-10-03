## 2025-02-28 - Composite Indexes for Chronological Queries
**Learning:** Models frequently queried by a foreign key (like userId) and sorted by a timestamp (like createdAt DESC) require composite database indexes to optimize the search and avoid in-memory sorting. In Prisma, the default index order is ASC, so `(sort: Desc)` must be explicitly specified when creating the index.
**Action:** Add composite indexes such as `@@index([userId, createdAt(sort: Desc)])` to tables like notifications, security_reports, and support_tickets to improve query performance.
