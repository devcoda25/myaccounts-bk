## 2026-07-09 - Missing Composite Indexes on Chronological Queries
**Learning:** Models like ParentalApproval and ParentalActivity that are frequently queried by childId and sorted by time (at) lack composite indexes, leading to expensive in-memory sorts.
**Action:** Always verify and add composite indexes like @@index([childId, at]) for chronologically sorted relation queries.
