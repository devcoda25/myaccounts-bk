## 2026-07-05 - Optimize findManyByChildId query on ParentalActivity
**Learning:** The `findManyByChildId` access pattern on `ParentalActivity` relies on filtering by `childId` and sorting by `at`, but lacks a composite index on `[childId, at]` which could lead to in-memory filesorts.
**Action:** Add the composite index `@@index([childId, at])` to the `ParentalActivity` model in `prisma/schema.prisma`.
