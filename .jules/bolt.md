## 2026-05-23 - [Database Index Optimization for Chronological Queries]
**Learning:** Chronological query patterns on models like Notification, SecurityReport, SupportTicket, Session, ChildProfile, ParentalApproval, and ParentalActivity require composite indexes matching the foreign key and sort column (e.g., `@@index([userId, createdAt])`) to prevent expensive in-memory sorts.
**Action:** Add composite indexes to Prisma models for frequently queried fields combined with sorting timestamps.
