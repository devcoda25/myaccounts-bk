## 2025-02-13 - Add composite indexes to Parental models
**Learning:** findManyByChildId access patterns on ParentalApproval and ParentalActivity models filter by childId and sort by at. They rely on @@index([childId, at]) to avoid in-memory filesorts.
**Action:** Add composite index @@index([childId, at]) to optimize findMany queries and avoid expensive in-memory sorts.
