## 2024-05-24 - Missing Composite Indexes for Chronological Queries
**Learning:** The `findMany` access patterns on `ParentalApproval`, `ParentalActivity`, and `ChildProfile` filter by an ID and sort by a timestamp descending, which causes expensive in-memory filesorts in PostgreSQL because Prisma does not automatically index foreign keys or create composite indexes for sorting.
**Action:** Always explicitly verify and add composite B-Tree indexes (e.g., `@@index([childId, at])`) in `schema.prisma` to naturally support `ORDER BY ... DESC` queries on filtered datasets.
