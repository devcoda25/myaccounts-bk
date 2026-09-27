## 2025-02-28 - [Performance: Add Composite Indexes for User Queries]
**Learning:** Models like Notification, SecurityReport, and SupportTicket are frequently queried by userId and sorted by createdAt (DESC) for pagination and timelines. Without composite indexes, the database must perform expensive in-memory sorts on the fetched rows.
**Action:** Always add composite indexes (e.g., `@@index([userId, createdAt(sort: Desc)])`) for queries involving a foreign key filter and a sort order, particularly for timestamp columns.
