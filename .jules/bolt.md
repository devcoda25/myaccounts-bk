## 2026-10-17 - [Database Optimization]
**Learning:** The SupportTicket and SecurityReport models are queried frequently by userId and sorted by createdAt, but they lack composite indexes to optimize these queries.
**Action:** Added composite indexes @@index([userId, createdAt(sort: Desc)]) to these models to speed up finding user tickets and reports.
