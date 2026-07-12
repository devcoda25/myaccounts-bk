## 2026-07-12 - Optimize ParentalActivity and ParentalApproval Queries
**Learning:** Models like ParentalActivity and ParentalApproval that are frequently queried by childId and sorted chronologically require a composite index like @@index([childId, at]) to avoid expensive in-memory sorts.
**Action:** Add the composite index @@index([childId, at]) to ParentalActivity and ParentalApproval models.
