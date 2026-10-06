## 2025-02-27 - [Prisma Index Optimization]
**Learning:** The `ParentalActivity` and `ParentalApproval` models are frequently queried by `childId` and sorted by `at` (descending). The `ChildProfile` model is frequently queried by `parentId` and sorted by `createdAt` (descending). These queries cause expensive in-memory sorts without composite indexes.
**Action:** Add composite indexes to Prisma models corresponding to frequent sort queries. Always remember to specify `(sort: Desc)` for descending indexes.
