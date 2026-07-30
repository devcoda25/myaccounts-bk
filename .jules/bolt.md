## 2025-03-01 - Add composite indexes for frequently queried fields
**Learning:** Found several models (`ChildProfile`, `ParentalApproval`, `ParentalActivity`) that are frequently queried by their relation ID (e.g. `childId`) and sorted by a timestamp. Adding composite indexes `@@index([foreignKey, timestamp])` to these models optimizes these queries and prevents expensive in-memory sorts in PostgreSQL.
**Action:** Always inspect Prisma schema for missing composite indexes on models that have timestamp-based sorting queries based on their repositories.
