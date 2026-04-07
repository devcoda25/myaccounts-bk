## 2024-04-07 - Missing composite indices for access patterns
**Learning:** Found multiple places where queries include a foreign key filter and an `orderBy` on a date field without supporting composite indices.
**Action:** Add the appropriate composite indices to `schema.prisma` to prevent full table scans and memory filesorts.
