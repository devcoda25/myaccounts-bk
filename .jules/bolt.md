## 2023-10-23 - Prisma Foreign Key Indexing
**Learning:** Prisma with PostgreSQL does not automatically index foreign keys like parentId on the ChildProfile model, which can cause full table scans on relation queries.
**Action:** Always manually add an @@index for foreign key fields when defining relations.