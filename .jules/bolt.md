## 2026-04-16 - [Database Composite Indexes for Chronological Ordering]
**Learning:** Chronological query patterns (e.g., retrieving the latest sessions, notifications, reports, or activities) require explicit composite indexes on the foreign key and timestamp columns in PostgreSQL. Without these, queries experience expensive in-memory sorts.
**Action:** Always explicitly check for and add composite indexes (e.g., `@@index([userId, createdAt])`) in `prisma/schema.prisma` when adding models that will be queried chronologically by a foreign key.
