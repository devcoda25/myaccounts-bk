## 2024-07-26 - Add composite index for Parental models
**Learning:** The ParentalActivity and ParentalApproval models are frequently queried by childId and sorted by at, requiring a composite index to avoid sorting bottlenecks.
**Action:** Add a composite index @@index([childId, at]) to optimize findManyByChildId queries with sorting.
