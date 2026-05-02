## 2024-05-02 - Missing composite indexes for chronological sorting in Parental module
**Learning:** The `findManyByParentId` and `findManyByChildId` query patterns in the parental control module rely on chronological sorting (`createdAt` or `at`), which without composite indexes leads to expensive in-memory filesorts.
**Action:** Always add composite indexes (e.g., `@@index([foreignKey, sortColumn])`) when filtering by a relation and ordering by a timestamp.
