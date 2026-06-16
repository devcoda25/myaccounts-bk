## 2026-06-16 - [Composite Indexes for sorting]
**Learning:** Models frequently queried by a foreign key or user ID and sorted chronologically require composite indexes to optimize queries and avoid expensive in-memory sorts.
**Action:** Always verify if queries use both a WHERE and an ORDER BY clause, and add a covering composite index for both fields if one doesn't exist.
