## 2024-06-20 - [Optimize Child Queries with Composite Indexes]
**Learning:** The application heavily relies on chronological lists scoped to specific relationships (`parentId`, `childId`, `userId`), leading to repeated missing index warnings in the performance audits and potential in-memory sorts during execution.
**Action:** Always add composite indexes matching the filtering key (e.g. `parentId` or `userId`) alongside the sorting key (e.g. `createdAt`, `at`, `lastUsedAt`) directly below the relation definitions within the schema models.
