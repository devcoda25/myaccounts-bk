## 2025-02-28 - [Model Indexes Optimization]
**Learning:** Models like Notification, SecurityReport, and SupportTicket frequently accessed by userId and sorted chronologically lack optimal composite indexes, which might lead to expensive in-memory sorts for findMany queries. Prisma default lacks some common performance indexes unless explicitly specified.
**Action:** Add composite indexes e.g., `@@index([userId, createdAt(sort: Desc)])` for fast sorted queries on user-specific models.
