
## 2025-03-25 - [Prisma PostgreSQL Composite Indexes]
**Learning:** In Prisma with PostgreSQL, B-Tree composite indexes naturally support `ORDER BY ... DESC` queries without needing explicit `sort: Desc` declarations in `@@index`. The access pattern filtering by a foreign key (e.g., `userId`, `childId`) and sorting by a timestamp field requires composite indexes to prevent expensive in-memory sorts and improve latency and scalability significantly.
**Action:** Identify and ensure the addition of these composite indexes like `@@index([userId, createdAt])` when creating or maintaining features that retrieve temporal data bound to specific entities.
