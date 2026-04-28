## 2026-04-28 - Missing Composite Indexes on Chronological Queries
**Learning:** In Prisma + PostgreSQL, when models are frequently queried by filtering on a foreign key and sorting by a timestamp (e.g., `where: { childId }, orderBy: { at: 'desc' }`), missing a composite index on `[foreignKey, timestamp]` results in expensive in-memory sorts.
**Action:** Always explicitly check for and add missing composite indexes on foreign keys and sort columns in `prisma/schema.prisma` when nested includes or chronological orderings are used.
