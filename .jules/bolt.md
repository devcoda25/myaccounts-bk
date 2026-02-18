## 2024-03-27 - [Missing Prisma Foreign Key Indexes]
**Learning:** Prisma with PostgreSQL does not automatically index foreign keys, causing performance issues on relations like `Notification.userId`, `ChildProfile.parentId`, etc.
**Action:** Manually add `@@index([foreignKey])` or `@@index([foreignKey, sortColumn])` to models in `schema.prisma`.
