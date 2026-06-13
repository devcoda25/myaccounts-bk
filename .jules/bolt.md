## 2026-06-13 - [Database Index for findManyByChildId Sorting]
**Learning:** The `ParentalApproval` and `ParentalActivity` models frequently query by `childId` and sort chronologically by `at`, leading to potential in-memory sorts without a composite index.
**Action:** Add `@@index([childId, at])` to `ParentalApproval` and `ParentalActivity` in `prisma/schema.prisma` to optimize database retrieval.
