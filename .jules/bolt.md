## 2025-02-27 - Indexing userId and createdAt for findMany queries
**Learning:** In a multi-tenant or user-centric application, queries that fetch resources by `userId` and sort them chronologically (e.g., `findMany` in `support.repository.ts`) require composite indexes to avoid expensive in-memory sorts.
**Action:** Always add `@@index([userId, createdAt(sort: Desc)])` to models like `SecurityReport` and `SupportTicket` that are frequently queried by `userId` and ordered descending by `createdAt`.
