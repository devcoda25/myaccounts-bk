## 2025-02-27 - [Index Parent/Child Queries]
**Learning:** The `ParentalActivity` and `ParentalApproval` models are frequently queried by `childId` and sorted by `at` (descending), and `ChildProfile` is queried by `parentId` and sorted by `createdAt` (descending).
**Action:** Add composite indexes with descending sort to optimize `findMany` queries.