## 2024-07-18 - ChildProfile findManyByParentId Optimization
**Learning:** The ChildProfile model is queried by parentId and ordered by createdAt descending in findManyByParentId, requiring a composite index to avoid expensive in-memory sorts.
**Action:** Add a composite index on [parentId, createdAt] to models frequently queried by a parent identifier and sorted chronologically.
