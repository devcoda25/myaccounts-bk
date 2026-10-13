## 2025-02-28 - Add composite indexes for chronological lists
**Learning:** Missing composite indexes on frequently queried relations sorted by time (`userId`, `createdAt` descending) can cause full table scans or expensive in-memory sorts (e.g. for Notification, SecurityReport, and SupportTicket models).
**Action:** Always add composite indexes (e.g., `@@index([userId, createdAt(sort: Desc)])`) when models are queried by a foreign key and sorted chronologically, and ensure `sort: Desc` is specified to match the DB-level order.
