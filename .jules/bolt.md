## 2025-02-27 - Composite Indexes
**Learning:** The database queries for parental controls (e.g. findManyByChildId) and support features (e.g. findUserTickets) filter by childId/userId and sort by descending timestamp. They lacked composite indexes, causing performance issues.
**Action:** Always inspect the repository files to identify query access patterns and add composite indexes to avoid expensive in-memory sort operations.
