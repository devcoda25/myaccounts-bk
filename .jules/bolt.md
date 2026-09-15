## 2025-02-27 - [Missing Composite Indexes on userId/createdAt]
**Learning:** Models like Notification, SecurityReport, and SupportTicket are frequently queried by userId and sorted descending by createdAt. Without composite indexes, the database must perform expensive in-memory sorts for these findMany operations.
**Action:** Always verify query access patterns for lists and ensure composite indexes exist for filtering + sorting to avoid performance degradation as data scales.
