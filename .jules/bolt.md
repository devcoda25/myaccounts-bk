## 2026-06-23 - [Database Indexes]
**Learning:** The database is missing composite indexes on frequently queried fields with sorting (e.g., `childId` and `at` for ParentalActivity and ParentalApproval, `parentId` and `createdAt` for ChildProfile, and `userId` and `createdAt` for SecurityReport and SupportTicket), which can lead to in-memory filesorts and poor performance.
**Action:** Add the appropriate `@@index` to these models in `prisma/schema.prisma`.
