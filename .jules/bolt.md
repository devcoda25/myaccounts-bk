## 2026-07-28 - Add missing composite indexes for descending sort queries
**Learning:** The database was missing composite indexes on fields frequently queried with sorting. Models like ChildProfile, ParentalApproval, ParentalActivity, SecurityReport, and SupportTicket are frequently queried by their parent or user ID and sorted by a timestamp. Adding composite indexes combining the parent or user ID and the timestamp optimizes these queries.
**Action:** Add composite indexes to Prisma schema for frequently queried fields combined with sorting timestamps.
