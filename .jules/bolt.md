## 2025-02-28 - [Support Repositories Indexing]
**Learning:** SupportTicket and SecurityReport models are frequently queried by userId and sorted by createdAt descending. Without composite indexes, this causes expensive in-memory sorts.
**Action:** Always add composite indexes like @@index([userId, createdAt(sort: Desc)]) on models frequently queried by relation ID and sorted chronologically.
