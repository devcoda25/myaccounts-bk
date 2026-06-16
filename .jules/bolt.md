## 2025-06-16 - Add performance indexes to Prisma schema
**Learning:** Models like SupportTicket, SecurityReport, ChildProfile, ParentalApproval, and ParentalActivity were frequently queried by their relation IDs and sorted chronologically, but lacked the necessary composite indexes. This can lead to slow in-memory sorts and potential N+1 query performance bottlenecks.
**Action:** Added targeted composite indexes (e.g., `@@index([userId, createdAt])`, `@@index([childId, at])`) to these models in `prisma/schema.prisma`.
