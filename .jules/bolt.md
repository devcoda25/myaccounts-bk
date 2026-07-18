## 2024-07-18 - Missing Composite Index
**Learning:** Models like ChildProfile that are frequently queried by a parent ID and sorted by a timestamp require a composite index to avoid inefficient queries.
**Action:** Always verify that queries filtering by a foreign key and sorting by a timestamp have a corresponding composite index.
