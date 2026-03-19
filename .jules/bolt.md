## 2024-05-20 - [Missing Indexes on Foreign Keys and OrderBy Columns]
**Learning:** Prisma with PostgreSQL does not automatically index foreign keys or columns frequently used in `orderBy` clauses. Queries filtering by a foreign key and sorting by a timestamp (e.g., `where: { childId }, orderBy: { at: 'desc' }`) can cause slow sequential scans or expensive in-memory sorts on large tables.
**Action:** Add composite B-tree indexes (e.g., `@@index([childId, at])`) to models with this query pattern to allow the database to use the index for both filtering and sorting simultaneously.
