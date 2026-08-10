## 2025-02-27 - Composite Indexes for Frequent Sorting
**Learning:** Models like SecurityReport and SupportTicket that are frequently queried by userId and sorted chronologically require composite indexes to optimize the query and prevent expensive in-memory sorts.
**Action:** Always verify query patterns in the repository files during exploration to apply the appropriate composite indexes.