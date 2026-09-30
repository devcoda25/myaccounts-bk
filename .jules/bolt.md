## 2025-02-27 - [Prisma Schema Performance Optimization]
 **Learning:** ChildProfile frequently queried by parentId (missing index). Notification frequently queried by userId (missing index). SupportTicket frequently queried by userId (missing index). SecurityReport frequently queried by userId (missing index). ParentalApproval frequently queried by childId (missing index). ParentalActivity frequently queried by childId (missing index).
 **Action:** Added composite indexes on these models.
