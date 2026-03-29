## 2024-02-14 - Prisma Foreign Key Indexing
**Learning:** Prisma does not automatically index foreign keys. This leads to hidden performance costs (full table scans) on relation queries like `findMany({ where: { foreignKey: ... } })`.
**Action:** Always audit `schema.prisma` for missing `@@index` on relation fields, especially those used in `findMany` filters.
