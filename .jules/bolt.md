## 2025-02-27 - [Add Composite Indexes for Sorted Database Queries]
**Learning:** Models frequently queried by parent/child ID or user ID and sorted chronologically require composite indexes to optimize findMany queries and avoid expensive in-memory sorts.
**Action:** Add composite indexes specifying the sort direction (e.g., `@@index([childId, at(sort: Desc)])`) directly on Prisma models and create the corresponding SQL migration file.
