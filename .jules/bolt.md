## 2025-02-20 - Add Missing Database Indexes on Foreign Keys and Timestamp columns
**Learning:** In a PostgreSQL database managed by Prisma, omitting composite indexes on fields frequently queried with a chronological sort (like `[userId, createdAt]` or `[childId, at]`) leads to inefficient in-memory filesorts when using nested includes.
**Action:** Add missing composite indexes in `prisma/schema.prisma` for models like `Session`, `Notification`, `SecurityReport`, `SupportTicket`, `ParentalApproval`, `ParentalActivity` and `ChildProfile`.
