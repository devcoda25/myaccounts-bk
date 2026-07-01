## 2024-07-01 - Missing index for findManyByChildId with sorting
**Learning:** The `findManyByChildId` access patterns on `ParentalApproval` and `ParentalActivity` filter by `childId` and sort by `at`. Without a composite index, this causes expensive in-memory filesorts.
**Action:** Add `@@index([childId, at])` to both models to optimize queries.

## 2024-07-01 - Missing index for findManyByParentId with sorting
**Learning:** The `ChildProfile` model relies on `findManyByParentId` which filters by `parentId` and sorts by `createdAt` descending. This requires a composite index to avoid in-memory filesorts.
**Action:** Add `@@index([parentId, createdAt])` to the model.
