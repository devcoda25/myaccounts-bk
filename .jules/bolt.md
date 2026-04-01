## 2025-04-01 - [Prisma B-Tree Composite Index Scaling]
**Learning:** In Prisma with PostgreSQL, B-Tree composite indexes (e.g., `@@index([childId, at])`) naturally support `ORDER BY ... DESC` queries without needing an explicit `sort: Desc` declaration in the schema. This optimizes chronological patterns across 1M+ user loads by preventing expensive in-memory filesorts.
**Action:** Always add composite indexes (e.g., `@@index([foreignKeyId, sortField])`) for models frequently queried with a `findMany` matching the same foreign key and sorting by that date/timestamp field.
