## 2024-05-24 - Missing Composite Indexes
**Learning:** findManyByChildId queries on ParentalApproval and ParentalActivity rely on sorting by `at` and need a composite index on `[childId, at]` to prevent expensive in-memory filesorts.
**Action:** Always verify matching composite indexes exist for chronological queries.
