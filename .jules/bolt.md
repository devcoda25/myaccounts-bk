## 2024-06-12 - [Performance Optimization: Chronological Indexing for findMany queries]
**Learning:** Models frequently queried by userId and sorted chronologically (e.g., Notification, SecurityReport, SupportTicket) require composite indexes like @@index([userId, createdAt]) to optimize findMany queries and avoid expensive in-memory sorts.
**Action:** Add @@index([userId, createdAt]) to Notification, SecurityReport, and SupportTicket models to improve query performance.
