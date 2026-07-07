## 2026-07-07 - Optimize Parental Queries
**Learning:** findManyByChildId access patterns on ParentalApproval and ParentalActivity models filter by childId and sort by at. They rely on @@index([childId, at]) to avoid in-memory filesorts.
**Action:** Add composite index @@index([childId, at]) to models frequently queried by childId and sorted chronologically.
