## 2024-05-18 - [Add composite index for sort queries]
**Learning:** findMany methods sorting chronologically by `createdAt` or `at` while filtering by ID perform in-memory filesorts if lacking a composite index covering both the filter and sort fields.
**Action:** Add composite indexes such as `@@index([parentId, createdAt])` and `@@index([childId, at])` for optimal query execution.
