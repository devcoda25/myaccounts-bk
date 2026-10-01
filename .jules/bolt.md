## 2025-02-28 - [Chronological Sort Indexes]
**Learning:** Models like Notification, SecurityReport, and SupportTicket queried by userId and sorted chronologically need composite indexes to avoid expensive in-memory sorts.
**Action:** Always add @@index([userId, createdAt(sort: Desc)]) when a model is frequently queried by user and ordered by creation time.
