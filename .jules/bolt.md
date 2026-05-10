## 2024-05-10 - Add Composite Indexes for Chronological Queries
**Learning:** Prisma queries that filter by a foreign key and sort by a timestamp (e.g., `where: { parentId }` and `orderBy: { createdAt: 'desc' }`) cause expensive in-memory filesorts if only single-column indexes exist. B-Tree composite indexes naturally support `ORDER BY ... DESC`.
**Action:** Add composite indexes `@@index([foreignKey, timestamp])` to models (ChildProfile, ParentalApproval, etc.) with this access pattern.
