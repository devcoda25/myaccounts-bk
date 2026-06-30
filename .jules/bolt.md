## 2024-06-30 - Add composite index for ParentalApproval and ParentalActivity
**Learning:** findManyByChildId queries for ParentalApproval and ParentalActivity lack a composite index for sorting by `at`, causing in-memory filesort.
**Action:** Added `@@index([childId, at])` to both models to optimize the query.
