## 2025-02-27 - [Performance Index Optimizations]
**Learning:** The database schema for Notification, SecurityReport, and SupportTicket lacks critical composite indexes required by application queries using 'userId' and 'createdAt(sort: Desc)'. Without these, PostgreSQL must perform expensive in-memory sorts which degrade performance heavily with growth.
**Action:** Always verify query plans for findMany endpoints ordering by descending creation times, and append `@@index([userId, createdAt(sort: Desc)])` to schemas handling these common patterns.
