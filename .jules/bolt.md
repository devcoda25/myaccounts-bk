## 2026-06-15 - Optimize chronological user queries
**Learning:** Models like SecurityReport, SupportTicket, and AuditLog are frequently queried by userId and sorted chronologically, but lack composite indices, causing expensive in-memory sorts.
**Action:** Add `@@index([userId, createdAt])` to these models to optimize findMany queries.
