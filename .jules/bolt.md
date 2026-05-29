## 2024-05-29 - Missing Indexes for Chronological Queries
**Learning:** Models like Session, Notification, SecurityReport, and SupportTicket filter by foreign key (userId, childId) and sort by timestamp (createdAt, lastUsedAt, at), causing slow in-memory filesorts.
**Action:** Adding composite indexes `@@index([userId, createdAt])` fixes the sequential query patterns and speeds up `findMany` by avoiding full-table scans.
