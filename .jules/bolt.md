## 2025-07-20 - Add Composite Indexes to Parental Models
**Learning:** The ParentalActivity and ParentalApproval models are frequently queried by childId and sorted by at, causing expensive database-level sorts without a composite index.
**Action:** Add @@index([childId, at]) to optimize findManyByChildId queries with sorting.
