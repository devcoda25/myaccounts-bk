## 2025-01-20 - [Optimize Parental Queries]
**Learning:** The findManyByChildId access patterns on ParentalApproval and ParentalActivity filter by childId and sort by at. They rely on composite index to avoid in-memory filesorts.
**Action:** Add @@index([childId, at]) on ParentalApproval and ParentalActivity.
