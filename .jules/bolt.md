## 2026-03-10 - Missing Composite Indexes on Foreign Keys
**Learning:** Prisma doesn't automatically index foreign keys like `childId` in PostgreSQL. Sorting by a timestamp (e.g., `at`) along with a foreign key filter necessitates a composite index for optimal performance to prevent expensive in-memory sorts.
**Action:** Always verify common query patterns (like `findManyByChildId`) and explicitly add composite indexes on foreign keys + sort columns in `prisma/schema.prisma`.
