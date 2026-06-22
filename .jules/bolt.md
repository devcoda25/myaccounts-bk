## 2024-06-22 - Missing Performance Indexes
**Learning:** Prisma models that frequently use `findMany` filtered by a foreign key and ordered by a timestamp (e.g., `childId` and `at` in `ParentalApproval` and `ParentalActivity`) need composite indexes to prevent expensive in-memory sorts.
**Action:** Add `@@index([childId, at])` to `ParentalApproval` and `ParentalActivity` to optimize these queries.
