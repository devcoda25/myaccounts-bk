## 2026-07-08 - [Database Index Optimization]
**Learning:** findManyByChildId access patterns on ParentalApproval and ParentalActivity models filter by childId and sort by at, requiring a composite index to avoid in-memory filesorts.
**Action:** Add @@index([childId, at]) to these models.
