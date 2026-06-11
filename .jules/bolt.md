## 2026-06-11 - Optimize Parental Data Fetching
 **Learning:** Nested includes in Prisma queries that fetch a parent model and chronologically order its included nested relationships (like approvals and activities) require composite indexes matching the foreign key and sort column to avoid in-memory sorts.
 **Action:** Added `@@index([childId, at])` to `ParentalApproval` and `ParentalActivity` to efficiently support `findManyByChildId` access patterns.
