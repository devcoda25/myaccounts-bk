## 2026-07-19 - [Optimize Parental Queries]
**Learning:** Models like ParentalActivity and ParentalApproval are frequently queried by childId and sorted by at, requiring a composite index to optimize the query.
**Action:** Add @@index([childId, at]) to models with this query pattern.
