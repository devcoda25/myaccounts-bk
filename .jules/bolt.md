## 2024-05-24 - Performance Optimizations
**Learning:** The `findManyByChildId` method in ParentalActivityRepository and ParentalApprovalRepository filters by `childId` and sorts by `at` descending, leading to inefficient queries without an appropriate composite index.
**Action:** Add `@@index([childId, at])` composite indexes to the `ParentalApproval` and `ParentalActivity` Prisma models to optimize queries sorting by the `at` field.
