## 2024-05-25 - Prevent In-Memory Sorts with Composite Indexes
**Learning:** Chronological query patterns on models like Notification, SecurityReport, SupportTicket, Session, ParentalActivity, and ParentalApproval rely heavily on composite indexes matching the foreign key and sort column to avoid expensive in-memory sorts.
**Action:** Always add composite indexes (e.g., `@@index([userId, createdAt])`) for models with queries that filter by a foreign key and sort chronologically.
