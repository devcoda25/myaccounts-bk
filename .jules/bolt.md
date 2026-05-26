## 2024-05-18 - [Prisma Composite Indexes]
**Learning:** Prisma models with queries that filter by an ID and sort chronologically (e.g., findManyByParentId) require composite indexes to avoid expensive in-memory sorts.
**Action:** Always add composite indexes to models to support common chronological access patterns.
