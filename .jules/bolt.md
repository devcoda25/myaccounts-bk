## 2025-02-27 - [Prisma Composite Indexes for Descending Sorts]
**Learning:** Found that ChildProfile, ParentalApproval, and ParentalActivity models were frequently queried by their parent foreign keys and sorted chronologically descending. Added composite indexes with (sort: Desc) to optimize these findManyByParentId and findManyByChildId queries.
**Action:** Always add composite indexes with (sort: Desc) for queries that filter by a foreign key and sort descending by timestamp, and verify the correct target SQL table via @@map.
