## 2024-04-22 - Missing Composite Indexes for Chronological Queries
**Learning:** Chronological query patterns (e.g., findByUserId sorted by createdAt DESC) lack composite indexes in PostgreSQL, leading to full table scans and expensive in-memory sorts for common access patterns.
**Action:** Add @@index([userId, createdAt]) or similar to Notification, SecurityReport, SupportTicket, and Session models in schema.prisma.
