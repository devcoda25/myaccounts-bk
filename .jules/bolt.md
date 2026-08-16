## 2025-02-28 - Add composite indexes
**Learning:** Models like Notification, SecurityReport, and SupportTicket are frequently queried by userId and sorted chronologically, but lack composite indexes. Adding `@@index([userId, createdAt(sort: Desc)])` optimizes these queries and avoids expensive in-memory sorts.
**Action:** Always add composite indexes for queries filtering by a foreign key and sorting by a timestamp.
