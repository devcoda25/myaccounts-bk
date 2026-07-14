## 2026-07-14 - Add missing database indexes on frequently queried fields
**Learning:** Models like ParentalActivity, ParentalApproval, ChildProfile, SecurityReport, and SupportTicket are frequently queried by foreign keys (childId, parentId, userId) and sorted by timestamp. The lack of composite indexes causes expensive in-memory sorts for findMany queries.
**Action:** Always verify access patterns in repository files and add matching composite indexes in prisma/schema.prisma.
