## 2026-06-13 - [Database Optimizations: Parental Models]
**Learning:** The `findManyByChildId` operations on both `ParentalActivity` and `ParentalApproval` filter by `childId` and sort by `at`, creating a performance bottleneck due to the lack of composite indexes for this query pattern.
**Action:** Add `@@index([childId, at])` to these models to optimize filtering and sorting and prevent in-memory filesorts.
