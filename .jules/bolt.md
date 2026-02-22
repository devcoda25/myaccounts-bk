## 2025-02-12 - [Prisma Indexing]
**Learning:** Prisma does not automatically index foreign keys in PostgreSQL, which can lead to performance bottlenecks in common queries like filtering by user and sorting by date.
**Action:** Always check schema.prisma for missing indexes on foreign keys, especially when used in `where` and `orderBy` clauses.
