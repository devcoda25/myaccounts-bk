## 2024-03-24 - [Add database indexes for chronological query patterns]
**Learning:** Chronological query patterns on SecurityReport, SupportTicket, and Session models require composite indexes (e.g., `@@index([userId, createdAt])` and `@@index([userId, lastUsedAt])`) to prevent expensive in-memory sorts.
**Action:** Always verify if there are any findMany queries ordering by timestamp (like `createdAt` or `lastUsedAt`) and add composite indexes to match the where clause and order by to prevent expensive filesorts in the database.
