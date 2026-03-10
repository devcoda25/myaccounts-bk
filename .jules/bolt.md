
## 2024-05-28 - [Missing Index on Common Access Pattern `findManyByChildId`]
**Learning:** Found common access patterns `findManyByChildId` in `ParentalApprovalRepository` and `ParentalActivityRepository` that filter by `childId` and sort by `at` descending. Since Prisma with PostgreSQL does not automatically index foreign keys, the queries result in sequential scans which degrade performance, especially on tables that are expected to grow significantly over time.
**Action:** Always verify if common access patterns (filtering and sorting together) in repositories are backed by proper composite indexes in the schema, e.g., `@@index([childId, at])` for optimal performance.
