## 2025-06-01 - [Composite Indexes for Chronological Queries]
**Learning:** Chronological query patterns on Notification, SecurityReport, SupportTicket, Session, and Parental models require composite indexes matching the foreign key and sort column (e.g., \`@@index([userId, createdAt])\`) to prevent expensive in-memory sorts.
**Action:** Always add appropriate composite indexes when implementing models with chronological list queries.
