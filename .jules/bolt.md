## 2025-02-27 - [Parental Module Query Optimization]
**Learning:** The `ParentalActivity` and `ParentalApproval` models are frequently queried by `childId` and sorted by `at` (descending). The `ChildProfile` model is queried by `parentId` and sorted by `createdAt` (descending). These queries can become expensive without composite indexes that match both the filter and sort conditions.
**Action:** Add composite indexes `@@index([childId, at(sort: Desc)])` and `@@index([parentId, createdAt(sort: Desc)])` to the respective models to optimize these read-heavy queries.
