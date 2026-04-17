## 2026-04-17 - Composite Indexes for Chronological Queries
**Learning:** Prisma models (Session, ChildProfile, ParentalApproval, ParentalActivity, Notification, SecurityReport, SupportTicket) frequently queried by foreign key and sorted by a timestamp suffer from expensive in-memory sorts without composite indexes in Postgres.
**Action:** Add composite indexes on the foreign key and timestamp columns to optimize access patterns.
