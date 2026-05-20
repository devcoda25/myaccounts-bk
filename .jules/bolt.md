## 2026-05-20 - [Database Indexing Optimization]
**Learning:** Missing composite indexes on chronological queries (e.g., `ORDER BY createdAt DESC`) cause expensive in-memory sorts on PostgreSQL. Adding these indexes significantly improves query performance.
**Action:** Add composite indexes to Prisma models for frequently queried chronological queries.
