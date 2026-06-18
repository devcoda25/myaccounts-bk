## 2024-04-17 - Missing Composite Indexes on Parent/Child Tables

**Learning:** Access patterns on `ParentalApproval`, `ParentalActivity`, and `ChildProfile` frequently filter by an ID (e.g., `childId`, `parentId`) and sort by a timestamp (e.g., `at`, `createdAt`). Prisma and PostgreSQL do not automatically index these combinations. Without composite indexes, these queries can degrade to expensive sequential scans and in-memory sorts as tables grow.

**Action:** Whenever introducing chronologically sorted query patterns on relational data, always add a composite index (e.g., `@@index([foreignKeyId, timestampColumn])`) to the schema to prevent performance bottlenecks.
