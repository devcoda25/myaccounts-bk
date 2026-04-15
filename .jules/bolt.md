## 2024-05-18 - Database Sort Indexing
**Learning:** In PostgreSQL with Prisma, common queries that filter by an FK (e.g., `userId`, `childId`) and sort by a date field (e.g., `createdAt`, `at`) often result in expensive in-memory sorts if they lack composite indexes covering both fields.
**Action:** Add `@@index([foreignKey, dateField])` to models exhibiting this chronological query access pattern to optimize sorting.
