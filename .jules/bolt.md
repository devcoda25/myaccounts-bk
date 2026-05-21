## 2026-05-21 - Chronological Indexing for Event Models
**Learning:** Chronological query patterns on Notification, SecurityReport, SupportTicket, and Session models require composite indexes (e.g., `@@index([userId, createdAt])` and `@@index([userId, lastUsedAt])`) to prevent expensive in-memory sorts.
**Action:** Always add composite indexes matching the foreign key and sort column for models with chronological query patterns.
