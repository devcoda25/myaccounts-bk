## 2025-02-27 - Missing Indexes on Chronologically Sorted Queries
**Learning:** Models like ParentalActivity and ParentalApproval are frequently queried by childId and sorted by date (at DESC), which can lead to inefficient in-memory sorting or slow database scans without a composite index.
**Action:** Always add composite indexes (e.g., @@index([foreignKeyId, dateField(sort: Desc)])) for relationships that are frequently retrieved in reverse chronological order.
