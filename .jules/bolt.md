## 2025-02-27 - [ChildProfile Composite Index]
**Learning:** The ChildProfile model is frequently queried by parentId and sorted by createdAt (descending). A composite index optimizes findManyByParentId queries by avoiding expensive in-memory sorts.
**Action:** Add @@index([parentId, createdAt(sort: Desc)]) to ChildProfile and generate the corresponding SQL migration.