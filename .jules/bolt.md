## 2026-07-21 - [Database Optimizations]
**Learning:** Models like `ParentalActivity` and `ParentalApproval` are frequently queried by `childId` and sorted by `at` (descending) via their repositories.
**Action:** Add a composite index like `@@index([childId, at])` to effectively optimize queries such as `findManyByChildId`.
