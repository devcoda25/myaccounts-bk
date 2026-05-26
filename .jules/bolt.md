## 2024-05-26 - [Add Indexes to ParentalApproval and ParentalActivity]
**Learning:** `findManyByChildId` access patterns on `ParentalApproval` and `ParentalActivity` models filter by `childId` and sort by `at`. They rely on `@@index([childId, at])` to avoid in-memory filesorts.
**Action:** Add `@@index([childId, at])` to the `ParentalApproval` and `ParentalActivity` models in `prisma/schema.prisma`.
