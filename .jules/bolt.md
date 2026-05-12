## 2024-05-18 - Add Composite Indexes for Chronological Queries
**Learning:** Chronological query patterns on models like Notification, SecurityReport, SupportTicket, Session, ParentalApproval, ParentalActivity, and ChildProfile require composite indexes matching the foreign key and sort column to prevent expensive in-memory sorts.
**Action:** Add composite indexes (e.g., `@@index([userId, createdAt])`) before the `@@map` declaration in Prisma schemas for models that are frequently filtered by an ID and sorted by a timestamp.
