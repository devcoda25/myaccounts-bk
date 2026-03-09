
## 2023-10-27 - [Prisma Indexes for Parental Controllers]
**Learning:** `ParentalApproval` and `ParentalActivity` models in the parental control module frequently queried by `childId` and sorted by `at` did not have composite indexes to avoid in-memory sorts on PostgreSQL. Prisma does not auto-index foreign keys in PostgreSQL.
**Action:** Always verify composite indexes are explicitly defined via `@@index([childId, at])` for `findMany` queries that involve filtering and sorting.
