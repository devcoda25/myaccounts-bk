## 2025-02-27 - [Missing Composite Indexes]
**Learning:** The ParentalActivity and ParentalApproval models are frequently queried by childId and sorted by at descending, but lacked composite indexes, causing expensive in-memory sorts. ChildProfile lacked an index for parentId and createdAt descending.
**Action:** Always verify that models with chronological findMany queries have appropriate composite indexes with sort directions in the Prisma schema to optimize database performance.
