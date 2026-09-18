## 2025-02-27 - [ChildProfile findManyByParentId optimization]
**Learning:** Models like ChildProfile are frequently queried by parentId and sorted by createdAt descending. Without a composite index, these queries require expensive in-memory sorts.
**Action:** Add a composite index `@@index([parentId, createdAt(sort: Desc)])` to optimize `findManyByParentId` queries.