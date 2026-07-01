## 2024-07-01 - Missing database index on frequently queried fields
**Learning:** The `ParentalActivity` and `ParentalApproval` models are frequently queried by `childId` and sorted by `at`. They were missing the `@@index([childId, at])` composite index, which can cause an expensive in-memory sort or full table scan.
**Action:** Add composite indexes on foreign keys and sorting columns when `orderBy` and `where` constraints are frequently paired.
