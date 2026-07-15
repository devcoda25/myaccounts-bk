## 2026-20-15 - [Add composite indexes for findManyByChildId]
**Learning:** The findManyByChildId access patterns on ParentalApproval and ParentalActivity models filter by childId and sort by at. They rely on composite indexes to avoid expensive in-memory filesorts.
**Action:** Add @@index([childId, at]) to models frequently queried by childId and sorted by a timestamp.
