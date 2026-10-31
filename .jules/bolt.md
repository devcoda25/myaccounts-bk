## 2024-10-31 - [Database Index Optimization]
**Learning:** The `ChildProfile` model in PostgreSQL has foreign keys like `parentId`, and related models like `ParentalApproval` and `ParentalActivity` have `childId`. These foreign key fields do not automatically get indexed by Prisma in PostgreSQL, which can lead to full table scans during relation queries.
**Action:** Always verify and manually add `@@index([field])` for foreign key fields used in relations to prevent N+1 and slow query issues.
