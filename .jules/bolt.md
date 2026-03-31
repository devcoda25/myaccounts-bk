## 2026-02-07 - [Missing Prisma Relation Indexes]
**Learning:** Prisma's PostgreSQL adapter does not automatically index foreign keys, leading to potential performance issues in high-volume tables like `Notification` and `SecurityReport` where user-centric queries are frequent.
**Action:** Always verify `schema.prisma` for `@@index` on foreign keys, especially in models with heavy read traffic or large potential growth.
