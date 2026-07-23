## 2024-07-23 - Index Performance Optimization
**Learning:** Models like ParentalActivity, ParentalApproval, and Session that are frequently queried by a foreign key (childId/userId) and sorted chronologically lack composite indexes, leading to expensive in-memory sorts.
**Action:** Add composite indexes spanning the foreign key and the sorting timestamp field to optimize findMany queries.
