## 2024-06-27 - [Missing Composite Indexes for Sorted Queries]
 **Learning:** findMany operations in Prisma that filter by a foreign key (e.g., childId, parentId) and sort by a timestamp (e.g., createdAt, at) require a composite index on both fields to avoid an expensive in-memory sort.
 **Action:** Add composite indexes (e.g., @@index([parentId, createdAt])) to models like ChildProfile, ParentalApproval, and ParentalActivity to optimize these frequent queries.
