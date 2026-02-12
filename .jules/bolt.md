## 2024-05-23 - [Missing FK Indexes]
**Learning:** Prisma models like `Notification` were missing indexes on foreign keys (`userId`) used in frequent queries (`findAll`), causing full table scans.
**Action:** Always verify `@@index` exists for foreign keys used in `where` clauses, especially combined with `orderBy`.
