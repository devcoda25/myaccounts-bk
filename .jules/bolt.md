## 2024-05-30 - [Missing Composite Indexes]
**Learning:** Nested includes in Prisma queries (e.g., fetching a parent model and chronologically ordering its included nested relationships like `findManyByParentId`) without composite indexes result in expensive in-memory sorts and full table scans.
**Action:** Always ensure that common access patterns filtering by a foreign key and sorting by a timestamp have a supporting composite index like `@@index([parentId, createdAt])`.
