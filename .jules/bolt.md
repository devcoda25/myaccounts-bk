## 2024-05-13 - [Missing Composite Indexes in Parental Queries]
**Learning:** The child profile repository makes repeated queries sorting by chronological fields (createdAt, at) filtered by relation IDs (parentId, childId). Without composite indexes, these queries trigger expensive in-memory sorts.
**Action:** Add composite indexes on ([parentId, createdAt]) and ([childId, at]) for these queries.
