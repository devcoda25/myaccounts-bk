## 2024-05-24 - Missing Composite Indexes on Chronological Queries
**Learning:** Models like `ParentalActivity`, `ParentalApproval`, and `ChildProfile` frequently queried by `childId`/`parentId` and sorted chronologically lack composite indexes, leading to expensive in-memory sorts.
**Action:** Always add composite indexes like `@@index([childId, at])` or `@@index([parentId, createdAt])` to optimize `findMany` queries with sorting.
